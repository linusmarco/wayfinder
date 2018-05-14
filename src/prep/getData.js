const fs = require('fs');
const path = require('path');

var request = require('request');

const config = require('../config.json');

const query = fs
    .readFileSync('wayNodes.overpassql', 'utf8')
    .replace('##AREAID##', String(3600000000 + config.mapAreaId));

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
