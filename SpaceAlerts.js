var http = require("http");

function getSpaceAlerts(publish) {
    http.get("http://services.swpc.noaa.gov/products/alerts.json", (res) => {
        var data = "";
        res.on("data", (c) => {
            data += c;
        });
        res.on("end", () => {
            try {
                processSpaceAlerts(JSON.parse(data), publish);
            } catch (e) {
            }
            setTimeout(getSpaceAlerts.bind(null, publish), 30000);
        });
    });
}

var lastAlerts = null;
function processSpaceAlerts(alerts, publish) {
    var date = Date.now();
    var newAlerts = [];
    alerts.forEach((alert) => {
        alert = Object.assign({
            product_id: alert.product_id,
            time: alert.issue_datetime
        }, parseSpaceAlert(alert.message.split("\r\n"), null, alert.message));
        var uniq = JSON.stringify(alert);
        if (lastAlerts && lastAlerts.indexOf(uniq) < 0) {
            publish(alert);
        }
        newAlerts.push(uniq);
    });
    lastAlerts = newAlerts;
}

var msglist = {
    "Space Weather Message Code": {
        label: "code"
    },
    "Serial Number": {
        label: "serial"
    },
    "CONTINUED ALERT": {
        label: "continued_alert",
        process: (data, messages, log) => {
            return Object.assign({
                alert: data
            }, parseSpaceAlert(messages.splice(0, 3), {
                "Continuation of Serial Number": {
                    label: "continuation_serial"
                },
                "Begin Time": {
                    label: "begin"
                },
                "Yesterday Maximum 2MeV Flux": {
                    label: "prev_max_2mev_flux"
                }
            }, log));
        }
    },
    "WARNING": {
        label: "warning"
    },
    "EXTENDED WARNING": {
        label: "extended_warning",
        process: (data, messages, log) => {
            return Object.assign({
                warning: data
            }, parseSpaceAlert(messages.splice(0, 1), {
                "Extension to Serial Number": {
                    label: "extension_serial"
                }
            }, log));
        }
    },
    "Valid From": {
        label: "valid",
        process: (data, messages, log) => {
            return Object.assign({
                from: data
            }, parseSpaceAlert(messages.splice(0, 1), {
                "Valid To": {
                    label: "to"
                },
                "Now Valid Until": {
                    label: "updated_to"
                }
            }, log));
        }
    },
    "Warning Condition": {
        label: "warning_condition"
    },
    "IP Shock Passage Observed": {
        label: "shock_passage"
    },
    "SUMMARY": {
        label: "summary"
    },
    "Observed": {
        label: "observed"
    },
    "Deviation": {
        label: "deviation"
    },
    "Station": {
        label: "station"
    },
    "ALERT": {
        label: "alert"
    },
    "Begin Time": {
        label: "begin"
    },
    "Threshold Reached": {
        label: "threshold_reached"
    },
    "Synoptic Period": {
        label: "synoptic_period"
    },
    "Estimated Velocity": {
        label: "estimated_velocity"
    },
    "Active Warning": {
        label: "has_warning"
    },
    "WATCH": {
        label: "watch"
    },
    "Highest Storm Level Predicted by Day": {
        label: "highest_storm_level_by_day",
        process: (data, messages) => {
            return messages.shift();
        }
    },
    "CANCEL WATCH": {
        label: "cancel_watch",
        process: (data, messages, log) => {
            return Object.assign({
                watch: data
            }, parseSpaceAlert(messages.splice(0, 2), {
                "Cancel Serial Number": {
                    label: "cancel_serial"
                },
                "Original Issue Time": {
                    label: "original_time"
                }
            }, log));
        }
    },
    "NOAA Scale": {
        label: "noaa_scale"
    },
    "Comment": {
        label: "comment"
    },
    "Description": {
        label: "description"
    },
    "Potential Impacts": {
        label: "impacts",
        array: true
    },
    "Issue Time": {
        discard: true
    }
};

function parseSpaceAlert(messages, list, log) {
    list = list || msglist;
    var obj = {};
    var next = function() {
        if (messages.length > 0) {
            var msg = processSpaceAlertMsg(messages.shift());
            if (msg) {
                if (list.hasOwnProperty(msg.type)) {
                    var msgdata = list[msg.type];
                    if (!msgdata.discard) {
                        if (msgdata.process) {
                            obj[msgdata.label] = msgdata.process(msg.data, messages, log);
                        } else if (msgdata.array) {
                            var data = msg.data ? [msg.data] : [];
                            var nextmsg;
                            while (nextmsg = messages.shift()) {
                                data.push(nextmsg);
                            }
                            obj[msgdata.label] = data;
                        } else if (msg.data) {
                            obj[msgdata.label] = msg.data;
                        }
                    }
                } else {
                    if (msg.data == "THIS SUPERSEDES ANY/ALL PRIOR WATCHES IN EFFECT") {
                        obj.replace_prior_watches = true;
                    } else if (msg.data != "NOAA Space Weather Scale descriptions can be found at" && msg.data != "www.swpc.noaa.gov/noaa-scales-explanation") {
                        console.log(msg, log);
                    }
                }
            }
            next();
        }
    };
    next();
    return obj;
}

function processSpaceAlertMsg(msg) {
    msg = msg.trim();
    var ind = msg.indexOf(":");
    if (ind > -1) {
        var type = msg.substr(0, ind);
        var data = msg.substr(ind + 1).trim();
        return {
            type,
            data
        };
    } else if (msg.length > 0) {
        return {
            data: msg
        };
    }
}

module.exports = getSpaceAlerts;