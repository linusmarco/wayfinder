const fs = require('fs');
const path = require('path');

var request = require('request');

const config = require('../config.json');

let query = fs.readFileSync('wayNodes.overpassql', 'utf8');

if (config.mapArea.id) {
    query = query.replace(
        '##AREA##',
        `area:${String(3600000000 + config.mapAreaId)}`
    );
} else if (
    !isNaN(config.mapArea.s) &&
    !isNaN(config.mapArea.w) &&
    !isNaN(config.mapArea.n) &&
    !isNaN(config.mapArea.e)
) {
    query = query.replace(
        '##AREA##',
        `${String(config.mapArea.s)},
    ${String(config.mapArea.w)},
    ${String(config.mapArea.n)},
    ${String(config.mapArea.e)}`
    );
} else {
    new Error('mapArea specified incorrectly in config.json');
}

const options = {
    method: 'POST',
    url: 'https://overpass-api.de/api/interpreter',
    headers: {
        'cache-control': 'no-cache',
        'content-type': 'application/x-www-form-urlencoded'
    },
    form: { data: query }
};

request(options, function(error, response, body) {
    if (error) throw new Error(error);

    ensureDirectoryExistence('../data/raw.json');
    fs.writeFileSync('../data/raw.json', body);
});

function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
}
