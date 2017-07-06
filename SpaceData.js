var http = require("http");
var readline = require("readline");

var files = [{
    type: "magnetic_fields",
    endpoint: "http://services.swpc.noaa.gov/products/solar-wind/mag-5-minute.json",
    json: true,
    headers: ["bx", "by", "bz", "lon", "lat", "bt"],
    cache: []
}, {
    type: "wind_plasma",
    endpoint: "http://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json",
    json: true,
    headers: ["density", "speed", "temperature"],
    cache: []
}, {
    type: "xray_flux",
    location: "W135",
    endpoint: "http://services.swpc.noaa.gov/text/goes-xray-flux-primary.txt",
    headers: ["short", "long"],
    cache: []
}, {
    type: "xray_flux",
    location: "W076",
    endpoint: "http://services.swpc.noaa.gov/text/goes-xray-flux-secondary.txt",
    headers: ["short", "long"],
    cache: []
}, {
    type: "particle_electron_flux",
    location: "W076",
    endpoint: "http://services.swpc.noaa.gov/text/goes-particle-flux-primary.txt",
    headers: ["particles_over_1_mev", "particles_over_5_mev", "particles_over_10_mev", "particles_over_30_mev", "particles_over_50_mev", "particles_over_100_mev", "electrons_over_0_8_mev", "electrons_over_2_mev", "electrons_over_4_mev"],
    cache: []
}, {
    type: "particle_electron_flux",
    location: "W135",
    endpoint: "http://services.swpc.noaa.gov/text/goes-particle-flux-secondary.txt",
    headers: ["particles_over_1_mev", "particles_over_5_mev", "particles_over_10_mev", "particles_over_30_mev", "particles_over_50_mev", "particles_over_100_mev", "electrons_over_0_8_mev", "electrons_over_2_mev", "electrons_over_4_mev"],
    cache: []
}, {
    type: "energetic_proton_flux",
    location: "W076",
    endpoint: "http://services.swpc.noaa.gov/text/goes-energetic-proton-flux-primary.txt",
    headers: ["protons_0_7_to_4_mev", "protons_4_to_9_mev", "protons_9_to_15_mev", "protons_15_to_40_mev", "protons_38_to_82_mev", "protons_84_to_200_mev", "protons_110_to_900_mev", "protons_350_to_420_mev", "protons_420_to_510_mev", "protons_510_to_700_mev", "protons_over_700_mev"],
    cache: []
}, {
    type: "energetic_proton_flux",
    location: "W135",
    endpoint: "http://services.swpc.noaa.gov/text/goes-energetic-proton-flux-secondary.txt",
    headers: ["protons_0_7_to_4_mev", "protons_4_to_9_mev", "protons_9_to_15_mev", "protons_15_to_40_mev", "protons_38_to_82_mev", "protons_84_to_200_mev", "protons_110_to_900_mev", "protons_350_to_420_mev", "protons_420_to_510_mev", "protons_510_to_700_mev", "protons_over_700_mev"],
    cache: []
}, {
    type: "aurora_hemispheric_power",
    endpoint: "http://services.swpc.noaa.gov/text/aurora-nowcast-hemi-power.txt",
    idsize: 2,
    headers: ["north", "south"],
    cache: []
}, {
    type: "geomagnetic_components",
    location: "W076",
    endpoint: "http://services.swpc.noaa.gov/text/goes-magnetometer-primary.txt",
    headers: ["hp", "he", "hn", "total"],
    cache: []
}, {
    type: "geomagnetic_components",
    location: "W135",
    endpoint: "http://services.swpc.noaa.gov/text/goes-magnetometer-secondary.txt",
    headers: ["hp", "he", "hn", "total"],
    cache: []
}];

function nextSpaceData(element, publish, callback) {
    if (element.json) {
        http.get(element.endpoint, (res) => {
            var data = "";
            res.on("data", (c) => {
                data += c;
            });
            res.on("end", () => {
                try {
                    processJSON(JSON.parse(data), element, publish);
                } catch (e) {
                }
                callback();
            });
        });
    } else {
        http.get(element.endpoint, (res) => {
            var rl = readline.createInterface({
                input: res
            });
            processTEXT(rl, element, publish, callback);
        });
    }
}

function getSpaceData(publish) {
    var started = Date.now();
    var count = 0;
    var next = function() {
        if (count >= files.length) {
            var dif = 30000 - (Date.now() - started); // Reload each 30 seconds from start
            if (dif > 0) {
                setTimeout(getSpaceData.bind(null, publish), dif);
            } else {
                getSpaceData(publish);
            }
        } else {
            nextSpaceData(files[count++], publish, next);
        }
    };
    next();
}

function processJSON(data, element, publish) {
    data.shift(); // Remove header
    data.forEach((arr) => {
        var time = arr.shift();
        if (element.cache.indexOf(time) < 0) {
            element.cache.push(time);
            if (element.cache.length > 50) {
                element.cache.splice(0, 25);
            }
            var pdata = {
                type: element.type
            };
            if (element.location) {
                pdata.location = element.location
            }
            if (arr.length > 0) {
                element.headers.forEach((name) => {
                    pdata[name] = arr.shift();
                });
                publish(pdata);
            }
        }
    });
}

function processTEXT(rl, element, publish, callback) {
    rl.on("line", (line) => {
        try {
            if (line && line[0] != "#") {
                line = line.trim().split(/,?\s+/);
                if (line.length > 0) {
                    var id = line.slice(0, element.idsize || 6).join("_");
                    if (element.cache.indexOf(id) < 0) {
                        element.cache.push(id);
                        if (element.cache.length > 200) {
                            element.cache.splice(0, 20);
                        }
                        line = line.slice(element.idsize || 6);
                        var pdata = {
                            type: element.type
                        };
                        if (element.location) {
                            pdata.location = element.location
                        }
                        if (line.length > 0) {
                            element.headers.forEach((name) => {
                                pdata[name] = line.shift();
                            });
                            publish(pdata);
                        }
                    }
                }
            }
        } catch (e) {
        }
    }).on("close", () => {
        callback();
    }).on("error", () => {
    });
}

module.exports = getSpaceData;