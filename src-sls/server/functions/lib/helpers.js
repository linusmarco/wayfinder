const request = require('request');

function requestPromise(options) {
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error || response.statusCode !== 200) reject(error);

            resolve({ response, body });
        });
    });
}

function parseSpeed(rawSpd) {
    let parsed;

    try {
        parsed = Number(rawSpd.replace('mph', ''));
    } catch (e) {
        console.error(`could not parse speed: ${rawSpd}`);
    }

    if (isNaN(parsed)) {
        console.error(`could not parse speed: ${rawSpd}`);
    } else {
        return parsed;
    }
}

function pointInBox(point, bounds) {
    if (!(point.lat >= bounds.s)) return false;
    if (!(point.lat <= bounds.n)) return false;
    if (!(point.lon >= bounds.w)) return false;
    if (!(point.lon <= bounds.e)) return false;

    return true;
}

module.exports = { requestPromise, parseSpeed, pointInBox };
