var RTM = require("satori-sdk-js"); // TODO: Deprecated

var SpaceAlerts = require("./SpaceAlerts");
var WeatherReadings = require("./WeatherReadings");
var Lightnings = require("./Lightnings");
var Hurricanes = require("./Hurricanes");
var SpaceData = require("./SpaceData");

// Credentials file
var credentials = require("./credentials.json");

// Satori.com publish keys
var roleSecretKey = credentials.satori.secret;
var appkey = credentials.satori.key;

var endpoint = "wss://open-data.api.satori.com";
var role = "full-weather";
var channel = "full-weather";

var roleSecretProvider = RTM.roleSecretAuthProvider(role, roleSecretKey);

var rtm = new RTM(endpoint, appkey, {
    authProvider: roleSecretProvider,
});

var subscription = rtm.subscribe(channel, RTM.SubscriptionMode.SIMPLE);

var subscribed = false;
subscription.on("enter-subscribed", function() {
    if (!subscribed) {
        subscribed = true;
        start();
    }
});

rtm.start();

function start() {
    SpaceAlerts((alert) => {
        rtm.publish(channel, {
            type: "space_alert",
            alert: alert
        });
    });

    WeatherReadings((data) => {
        rtm.publish(channel, {
            type: "atmospheric_data",
            data: data
        });
    });

    Lightnings((location) => {
        rtm.publish(channel, {
            type: "lightning",
            location: location
        });
    });

    Hurricanes((location) => {
        rtm.publish(channel, {
            type: "hurricane",
            location: location
        });
    });

    SpaceData((data) => {
        rtm.publish(channel, {
            type: "space_data",
            data: data
        });
    });
}