var WebSocket = require("ws");

function getLightnings(publish) {
    var ws = new WebSocket("ws://ws.blitzortung.org:8082/");
    ws.on("open", () => {
        ws.send(JSON.stringify({ west: -180, east: 180, north: 90, south: -90 }));
    });
    ws.on("message", (lightning) => {
        try {
            lightning = JSON.parse(lightning);
            publish({
                coords: {
                    lon: lightning.lon,
                    lat: lightning.lat,
                    alt: lightning.alt
                },
                polarity: lightning.pol,
                max_deviation_span_ns: lightning.mds,
                max_circular_gap: lightning.mcg
            });
        } catch (e) {
        }
    });
    ws.on("close", () => {
        getLightnings(publish);
    });
}

module.exports = getLightnings;