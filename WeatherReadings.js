var http = require("http");

var openweather = require("./credentials").openweather.key;
var mesowest = require("./credentials").mesowest.key;

function run(publish) {
    getWeather(publish); // Openweather
    nextQuadrant(publish); // Mesowest
}

function getWeather(publish) {
    http.get("http://api.openweathermap.org/data/2.5/box/city?bbox=-180,90,180,-90,20&&cluster=no&appid=" + openweather, (res) => {
        var data = "";
        res.on("data", (c) => {
            data += c;
        });
        res.on("end", () => {
            try {
                data = JSON.parse(data);
            } catch (e) {
            }
            processWeather(data, publish);
        });
    });
}

var previousList = {};

function processWeather(data, publish) {
    var topublish = [];
    try {
        data.list.forEach((w) => {
            if (previousList[w.id] != w.dt) {
                previousList[w.id] = w.dt;
                topublish.push({
                    id: "ow_" + w.id,
                    name: w.name,
                    coords: {
                        lon: w.coord.Lon,
                        lat: w.coord.Lat
                    },
                    variables: {
                        air_temp: {
                            value: w.main.temp,
                            units: "Celsius"
                        },
                        air_tepressuremp: {
                            value: w.main.pressure * 100,
                            units: "Pascals"
                        },
                        relative_humidity: {
                            value: w.main.humidity,
                            unit: "%"
                        },
                        sea_level_pressure: w.main.hasOwnProperty("sea_level") ? {
                            value: w.main.sea_level * 100,
                            unit: "Pascals"
                        } : undefined, // undefined is not serialized by JSON.stringify
                        wind_speed: {
                            value: w.wind.speed,
                            unit: "m/s"
                        },
                        wind_direction: {
                            value: w.wind.deg,
                            unit: "Degrees"
                        },
                        wind_gust: {
                            value: w.wind.gust,
                            unit: "m/s"
                        },
                        precip_accum_three_hour: (w.rain && w.rain["3h"]) ? {
                            value: w.rain["3h"],
                            unit: "Millimeters"
                        } : undefined, // undefined is not serialized by JSON.stringify
                        snow_accum_three_hour: (w.snow && w.snow["3h"]) ? {
                            value: w.snow["3h"],
                            unit: "Millimeters"
                        } : undefined, // undefined is not serialized by JSON.stringify
                    }
                });
            }
        });
    } catch (e) {
    }
    if (topublish.length > 0) {
        // Shuffle to publish data all around the map instead of focusing on spots
        shuffle(topublish);

        // Publish them until the next call in 2 hours minutes instead of pushing a big bulk
        publishStations(topublish, (2 * 60 * 60 * 1000) / topublish.length, publish, () => {
            getWeather(publish);
        });
    } else {
        setTimeout(() => {
            getWeather(publish);
        }, (2 * 60 * 1000));
    }
}

module.exports = getWeather;

// USA only
var key = require("./credentials").mesowest.key;
// Divide the api calls by quadrants
var quadrants = [];
//var divisor = 1; // 1 quadrant
//var divisor = 4; // 16 quadrants
//var divisor = 10; // 100 quadrants
var divisor = 20; // 400 quadrants

var lonmin = -180;
var lonmax = 180;
var latmin = -90;
var latmax = 90;

var lontotal = Math.abs(lonmin) + Math.abs(lonmax);
var lattotal = Math.abs(latmin) + Math.abs(latmax);

var londif = lontotal / divisor;
var latdif = lattotal / divisor;

var lon = lonmin;
var prelon = lonmin;

do {
    prelon = lon;
    lon += londif;

    var lat = latmin;
    var prelat = latmin;
    do {
        prelat = lat;
        lat += latdif;
        quadrants.push([prelon <= lonmin ? prelon + 0.001 : prelon, prelat <= latmin ? prelat + 0.001 : prelat, lon >= lonmax ? lon - 0.001 : lon, lat >= latmax ? lat - 0.001 : lat].join(",")); // Decimal fix as mesowest don't accepts minimum and maximum lon and lat
    } while (lat < latmax);
} while (lon < lonmax);

// The amount of stations I can query per hour. API limited
var hour_limit = 100000;

// The time publishing one station should last to not surpass the limit
var perstation = Math.ceil((60 * 60 * 1000) / hour_limit);

// Add 5% more time per station to not be so close to the limit
perstation += Math.ceil(perstation * 0.05);

var reservedquadrants = [];
setInterval(() => {
    // Add the reserved quadrants for requery each 6 hours, just in case they are updated
    quadrants = quadrants.concat(reservedquadrants);
}, 3 * 60 * 60 * 1000);

var cachedQuadrants = [];

function nextQuadrant(publish) {
    var quadrant = quadrants.shift(); // Remove from bottom stack
    http.get("http://api.mesowest.net/v2/stations/latest?status=active&bbox=" + quadrant + "&token=" + mesowest, (res) => {
        var data = "";
        res.on("data", (c) => {
            data += c;
        });
        res.on("end", () => {
            try {
                data = JSON.parse(data);
            } catch (e) {
            }
            if (data.SUMMARY.RESPONSE_CODE == -1) { // No stations found for this request
                // Remove the quadrant and reserve it to query it later, just in case new stations are added
                reservedquadrants.push(quadrant);
                return nextQuadrant(publish);
            } else {
                if (data.STATION) {
                    processQuadrant(data, publish);
                } else {
                    nextQuadrant(publish);
                }
            }
            quadrants.push(quadrant); // Push to top stack
        });
    });
}

var list = {};

var processing = false;
var processQeue = [];
function processQuadrant(data, publish) {
    if (processing) {
        processQeue.push(data);
        return;
    }
    processing = true;
    if (processQeue.length == 0) {
        // Preload a quadrant
        nextQuadrant(publish);
    }
    if (data && data.STATION && data.STATION.length > 0) {
        var units = data.UNITS || {};
        var topost = [];

        // Find updated variables        
        data.STATION.forEach((station) => {
            try {
                var variables = {};
                if (!list.hasOwnProperty(station.ID)) {
                    list[station.ID] = {
                        variables: {}
                    }
                }
                var oldStation = list[station.ID];
                var oldVariables = oldStation.variables;
                for (var vartype in station.SENSOR_VARIABLES) {
                    if (!oldVariables.hasOwnProperty(vartype)) {
                        oldVariables[vartype] = {};
                    }
                    var oldvar = oldVariables[vartype];
                    var unit = units.hasOwnProperty(vartype) ? units[vartype] : null;
                    var vars = station.SENSOR_VARIABLES[vartype];
                    var varnames = Object.keys(vars);
                    var v = [];
                    varnames.forEach((varname) => {
                        if (station.OBSERVATIONS.hasOwnProperty(varname)) {
                            var obs = station.OBSERVATIONS[varname];
                            var t = new Date(obs.date_time).getTime();
                            if (!oldvar.hasOwnProperty(varname) || oldvar[varname] != obs.date_time) {
                                v.push({
                                    value: obs.value,
                                    name: varname
                                });
                            }
                            oldvar[varname] = t;
                        }
                    });
                    if (v.length > 0) {
                        if (varnames.length == 1) {
                            v = v[0].value;
                        }
                        variables[vartype] = {
                            value: v,
                            unit
                        };
                    }
                }
                if (Object.keys(variables).length > 0) {
                    topost.push({
                        id: "mw_" + station.ID,
                        name: station.NAME,
                        coords: {
                            lon: Number(station.LONGITUDE),
                            lat: Number(station.LATITUDE),
                            alt: Number(station.ELEVATION)
                        },

                        timezone: station.TIMEZONE,
                        data: variables
                    });
                }
            } catch (e) {
            }
        });

        // Stream the stations that have updated variables along the theorical duration of this quadrant
        if (topost.length > 0) {
            // Shuffle to publish data all around the map
            shuffle(topost);
            var timeoutPerStation = data.STATION.length * perstation / topost.length;
            publishStations(topost, timeoutPerStation, publish, () => {
                processing = false;
                if (processQeue.length > 0) {
                    processQuadrant(processQeue.shift(), publish);
                }
            });
        }
    } else {
        processing = false;
        if (processQeue.length > 0) {
            processQuadrant(processQeue.shift(), publish);
        }
    }
}

function publishStations(stations, timeout, publish, end) {
    var interval = setInterval(() => {
        if (stations.length > 0) {
            publish(stations.shift());
        } else {
            clearInterval(interval);
            end();
        }
    }, timeout);
}

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
}

module.exports = run;