var http = require("http");

var key = require("./credentials").wundergournd.key;

function getHurricanes(publish) {
    http.get("http://api.wunderground.com/api/" + key + "/currenthurricane/view.json", (res) => {
        var data = "";
        res.on("data", (c) => {
            data += c;
        });
        res.on("end", () => {
            try {
                processHurricanes(JSON.parse(data).currenthurricane, publish);
            } catch (e) {
            }
            setTimeout(getHurricanes.bind(null, publish), 30 * 1000);
        });
    });
}

// TODO: Delete old storms
var storms = {};

function processHurricanes(list, publish) {
    list.forEach((storm) => {
        if (!storms.hasOwnPorperty(storm.stormInfo.stormNumber) || storms[storm.stormInfo.stormNumber] != storm.Time) {
            storms[storm.stormInfo.stormNumber] = storm.Time;
            publish({
                name: storm.stormInfo.stormName_Nice,
                coords: {
                    lon: storm.lon,
                    lat: storm.lat
                },
                ss_category: storm.SaffirSimpsonCategory,
                category: storm.Category,
                wind: {
                    speed: storm.WindSpeed,
                    gust: storm.WindGust,
                    quadrants: storm.WindQuadrants,
                    radius: storm.WindRadius
                },
                speed: storm.Fspeed,
                direction: storm.Movement,
                pressure: storm.Pressure
            });
        }
    });
}

module.exports = getHurricanes;