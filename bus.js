const request = require('request');

const routeToKey = {
    "Mountaintop Express": '1',
    "Saucon Village": '2',
    "T.R.A.C.S.": '3',
    "TRACS": '3',
    "Athletics": '4',
    "Packer Express": '10',
    "Campus Connector": '11'
};

const busAbbr = {
    "Mountaintop Express" : "MT", 
    "T.R.A.C.S": "TR",
    "Packer Express": "PE",
    "Campus Connector": "CC",
    "Saucon Village": "SV",
    "Athletics": "AT"
}

const TimeTableURL = "http://buses.lehigh.edu/scripts/routestoptimes.php?format=json"

const makeCORRequest = (url, callback) => {
    var options = {
        method: 'GET',
        url: url,
        qs: {format: 'json'},
        headers: {"origin": "Android", "User-Agent": "Android"}
    };
    request(options, function (error, response, body) {
        callback(error, response, body);
    });
}

const getTimeTable = (callback) => {
    // const testBody = require('./testdata/timetable');
    // callback(null, null, testBody);

    makeCORRequest(TimeTableURL, function(error, response, body) {
        callback(error, response, JSON.parse(body))
    });
}

// Determines what time the bus will arrive at a destination
// Parameters:
//  timetable - a timetable json given by getTimeTable
//  bus - a string containing the name of a bus
//        look in the keys of routeToKey for valid options
//  dest - a string with the name of the destination
//         must match name on the timetable
// Return values:
// "Arriving Soon"
// "At Stop"
// "Just Departed"
// "HH:MM"
// "-" - Indicates the bus is not running
// false to indicate the bus does not go to the destination
function getArrival(timeTable, bus, dest) {
    if (routeToKey[bus] == null || timeTable[routeToKey[bus]] == null) {
        return false
    }

    const stops = timeTable[routeToKey[bus]]["stops"]

    for (var stop in stops) {
        const stopInfo = stops[stop]
        if (stopInfo.name == dest) {
            return stopInfo.arrival
        }
    }

    return false
}

// Gets the time interval that a bus goes through its entire route
// in minutes.
// Parameters:
//  timetable - a timetable json given by getTimeTable
//  bus - a string containing the name of a bus
//        look in the keys of routeToKey for valid options
// Returns false if the bus is not running or there is no loop
//          otherwise returns minutes for bus to return to same spot
function getInterval(timeTable, bus) {
    if (routeToKey[bus] == null || timeTable[routeToKey[bus]] == null) {
        return false
    }
    const schedule = timeTable[routeToKey[bus]]["schedule"]

    if (Object.keys(schedule).length <= 2) {
        return false
    } 

    // In the JSON file, each scheudle object is given as a string
    // Regex is used to extract the time information
    // We look for a loop to determine the interval of the bus
    
    var visitedStops = []
    var stopTimes = []

    var r = false
    Object.keys(schedule).forEach(function(key) {
        var descRegex = /Departs ([a-zA-Z\s]*) at ([0-9]{1,2}):([0-9]{2}) ([PMA]{2})/g
        
        // If we have found the interval already then ignore the loop
        if (r != false) {
            return
        }

        var desc = schedule[key];
        var matches = descRegex.exec(desc)

        if (matches != null) {
            var stop = matches[1]

            // convert hours into 24 hour clock
            var hour = parseInt(matches[2]) + 12 * (matches[4] == "PM" ? 1 : 0)
            var minute = parseInt(matches[3])

            var stopIndex = -1;
            for (var i = 0; i < visitedStops.length; i++) {
                if (visitedStops[i] == stop) {
                    stopIndex = i
                    break
                }
            }

            if (stopIndex != -1) {
                var timeIndex = 2 * stopIndex
                var hour0 = stopTimes[timeIndex]
                var minute0 = stopTimes[timeIndex + 1]

                var d0 = new Date()
                d0.setHours(hour0, minute0)
                var d1 = new Date()
                d1.setHours(hour,minute)

                var dT = d1.getTime() - d0.getTime();

                r = dT/(60 * 1000)
                return
            }

            visitedStops.push(stop)
            stopTimes.push(hour)
            stopTimes.push(minute)
        } else {
            console.log("No match at '" + desc + "'");
        }


    })

    return r

}

function getNextStops(data, bus) {
    var stops = []
    Object.keys(data).foreach(function(key) {
        if (busData[key].key == busAbbr[bus]) {
            if(busData[key].currentstop != "") {
                stops.push(busData[key].currentstop)
            }
        }
    }) 

    return stops
}

// Determines if the bus goes to the destination
// Look at comments in getArrival, for a description of parameters.
function busGoesTo(timeTable, bus, dest) {
    return getArrival(timeTable, bus, dest) != false;
}


const CONNTECTIVITY_ISSUES_FULLFILLMENT = "I'm having trouble getting the bus routes at the moment. Please try again later."


const BUS_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'Location': (req, res) => {
        const app = new DialogflowApp({req, res});
        if (app.isPermissionGranted()) {
            app.tell("You have granted permission");
        } else {
            app.askForPermission('To locate you', app.SupportedPermissions.DEVICE_PRECISE_LOCATION);
        }
    },
    'Destination': (req, res) => {
        const bus = req.body.queryResult.parameters.bus;
        const dest = req.body.queryResult.parameters.destination;

        getTimeTable(function(error, response, timeTable) {
            var fullfillment = null
            if (error != null) {
                fullfillment = CONNTECTIVITY_ISSUES_FULLFILLMENT
            } 
            else {
                const arrival = getArrival(timeTable, bus, dest)
                switch(arrival) {
                    case false:
                        fullfillment = bus + " does not stop at " + dest
                        break;
                    case "Arriving Soon":
                        fullfillment = bus + " will be arriving soon."
                        break;
                    case "Just Departed":
                        fullfillment = bus + " just left " + dest
                        break;
                    case "At Stop":
                        fullfillment = bus + " is at " + dest
                        break;
                    case "-":
                        fullfillment = bus + " is not running"
                        break;
                    default:
                        fullfillment = bus + " arrives at " + arrival
                        break;
                }
            }
            res.json({
                fulfillment_text: fullfillment
            })
        })
    },
    'FromTo': (req, res) => {
        var origin = req.body.queryResult.parameters.origin;
        var dest = req.body.queryResult.parameters.destination;
        if (origin == dest) {
            res.json({
                fulfillment_text: "You don't need a bus!"
            })
            return
        }

        getTimeTable(function(error, response, timeTable) {
            var fullfillment;

            if (error != null) {
                fullfillment = CONNTECTIVITY_ISSUES_FULLFILLMENT
            } else {
                var buses = []

                Object.keys(timeTable).forEach(function(key) {
                    var bus = timeTable[key].name
                    if (busGoesTo(timeTable, bus, dest) && busGoesTo(timeTable, bus, origin)) {
                        buses.push(bus)
                    }
                });

                if (buses.length == 0) {
                    fullfillment = "There is no bus from " + origin + " to " + dest;
                } else if (buses.length == 1) {
                    fullfillment = "To get to " + dest + ", you can take the " + buses[0] + " bus"
                } else {
                    fullfillment = "To get to " + dest + ", you can take either the " + buses[0] + " bus or the " + buses[1] + " bus"; 
                }
            }

            res.json({
                fulfillment_text: fullfillment
            })
        });
    },
    'Interval': (req, res) => {
        getTimeTable(function(error, response, timeTable) {
            var fullfillment;

            if (error != null) {
                fullfillment = CONNTECTIVITY_ISSUES_FULLFILLMENT
            } else {
                var bus = req.body.queryResult.parameters.bus;
                var dest = req.body.queryResult.parameters.dest;

                var arrivalTime = getArrival(timeTable, bus, dest);
                if (!arrivalTime) {
                    fullfillment = "The " + bus + " bus does not go to " + dest; 
                } else if (arrivalTime == "-") {
                    fullfillment = "The " + bus + " bus is not running right now.";
                } else {
                    var interval = Math.floor(getInterval(timeTable, bus));
                    if (arrivalTime == "Arriving Soon" 
                        || arrivalTime == "At Stop" 
                        || arrivalTime == "Just Departed") {
                        fullfillment = "The " + bus + " bus arrives every " + interval + " minutes"
                    } else if (!interval) {
                        fullfillment = "The " + bus + " bus doesn't travel at an interval";
                    } else {
                        fullfillment = "The " + bus + " bus arrives every " + interval + " minutes starting at " + arrivalTime
                    }
                }
            }

            res.json({
                fulfillment_text: fullfillment
            })

        })
    },
    'Schedule': (req, res) => {
        var bus = req.body.queryResult.parameters.bus

        getTimeTable(function(error, response, timeTable) {
            var fullfillment;
            if (error != null) {
                fullfillment = CONNTECTIVITY_ISSUES_FULLFILLMENT;
            } else {
                if (routeToKey[bus] == null || timeTable[routeToKey[bus]] == null) {
                    fullfillment = "Could not find that bus"
                } else {
                    const schedule = timeTable[routeToKey[bus]]["schedule"]

                    var i = 0
                    fullfillment = ""
                    Object.keys(schedule).forEach(function(key) {
                        if (i > 2) {
                            return
                        }
                        var desc = schedule[key]
                        desc = desc.replace("<strong>", "");
                        desc = desc.replace("</strong>", "");
                        desc = desc.toLowerCase()
                        desc = bus + " " + desc


                        fullfillment += desc + "\n";

                        i += 1
                    })

                }

            }

            res.json({
                fulfillment_text: fullfillment
            })

        })
    },
    'Location': (req, res) => {
        var bus = req.body.queryResult.parameters.bus

        getBusData(function(error, respone, busData) {
            if (error != null) {
                res.json({
                    fulfillment_text: CONNTECTIVITY_ISSUES_FULLFILLMENT
                })
            } else {
                getTimeTable(function(error, response, timeTable) {
                    var fullfillment;
                    if (error != null) {
                        fullfillment = CONNTECTIVITY_ISSUES_FULLFILLMENT
                    } else {
                        var times = []
                        var stops = getNextStops(busData, bus);
                        for (var i = 0; i < stops.length; i++ ) {
                            const arrival = getArrival(timeTable,bus, stops[i])
                            if (arrival != "-" || !arrival) {
                                times.push(arrival)
                            }
                        }
                        if (times.length == 0) {
                            
                        }
                        if (times.length == 1) {

                        }
                    }
                })
            }
        })
    }
};

module.exports = BUS_FUNCTION_ACTION_NAME_TO_FUNCTION;
