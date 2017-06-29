var http = require("http");

var key = require("./credentials").mesowest.key;

/*
// openweathermap updates data each 2 hours and has half the number of nodes than mesowest
// No need to divide by quadrants as they limit by API call count, not by number of stations queried
function getWeather(publish) {
    http.get("http://api.openweathermap.org/data/2.5/box/city?bbox=-180,90,180,-90,20&&cluster=no&appid=" + key, (res) => {
        var data = "";
        res.on("data", (c) => {
            data += c;
        });
        res.on("end", () => {
            try {
                processWeather(JSON.parse(data).list, publish);
            } catch (e) {
            }
            setTimeout(getWeather.bind(null, publish), 30*60*1000);
        });
    });
}

var previousList = {};

function processWeather(list, publish) {
    list.forEach((w) => {
        if (previousList[w.id] != w.dt) {
            previousList[w.id] = w.dt;
            publish({
                name: w.name,
                coords: w.coord,
                environment: w.main,
                wind: w.wind,
                rain_volume: w.rain || 0,
                snow_volume: w.snow || 0,
                clouds_coverage: (w.clouds && w.clouds.hasOwnProperty("today")) ? w.clouds.today + "%" : "unknown"
            });
        }
    });
}*/

// Divide the api calls by quadrants (100 quadrants)
var quadrants = [];
var divisor = 10;

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
        quadrants.push([prelon == lonmin ? prelon + 0.001 : prelon, prelat == latmin ? prelat + 0.001 : prelat, lon == lonmax ? lon - 0.001 : lon, lat == latmax ? lat - 0.001 : lat].join(",")); // Decimal fix as mesowest don't accepts minimum and maximum lon and lat
    } while (lat < latmax);
} while (lon < lonmax);

var currentQuadrant = 0;

var looptimeout = (30 * 60 * 1000) / quadrants.length; // Loop throgh all the quadrants each 30 minutes (around 40k stations are queried and we have a 100k station limit per hour).

var reservedquadrants = [];
setInterval(() => {
    // Add the reserved quadrants for requery each 6 hours, just in case they are updated
    quadrants = quadrants.concat(reservedquadrants);
    looptimeout = (30 * 60 * 1000) / quadrants.length;
}, 6 * 60 * 60 * 1000);

function getWeather(publish) {
    console.log("http://api.mesowest.net/v2/stations/latest?status=active&bbox=" + quadrants[currentQuadrant] + "&token=" + key);
    http.get("http://api.mesowest.net/v2/stations/latest?status=active&bbox=" + quadrants[currentQuadrant] + "&token=" + key, (res) => { // TODO, change -17 = -179
        var data = "";
        res.on("data", (c) => {
            data += c;
        });
        res.on("end", () => {
            try {
                data = JSON.parse(data);
                if (data.SUMMARY.RESPONSE_CODE == -1) { // No stations found for this request
                    // Remove the quadrant and reserve it to query it later, just in case new stations are added
                    reservedquadrants.push(quadrants.splice(currentQuadrant, 1)[0]);
                    looptimeout = (30 * 60 * 1000) / quadrants.length;
                    return getWeather(publish);
                } else {
                    processWeather(data, publish);
                }
            } catch (e) {
                console.log(e);
            }
            currentQuadrant++;
            setTimeout(getWeather.bind(null, publish), looptimeout);
        });
    });
}

var list = {};

function processWeather(data, publish) {
    var units = data.UNITS;
    var topost = [];
    data.STATION.forEach((station) => {
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
                id: station.ID,
                name: station.NAME,
                timezone: station.TIMEZONE,
                coords: {
                    lon: station.LONGITUDE,
                    lat: station.LATITUDE,
                    alt: station.ELEVATION
                },
                data: variables
            });
        }
    });

    // Stream them along the next looptimeout time (18 seconds right now) so are not sent in bulk
    if (topost.length > 0) {
        var timeout = looptimeout / topost.length;
        var next = () => {
            var st = topost.shift();
            if (st) {
                publish(st);
                setTimeout(next, timeout);
            }
        }
        next();
    }
}

module.exports = getWeather;