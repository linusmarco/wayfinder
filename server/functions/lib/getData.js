const fs = require('fs');
const path = require('path');

const hlp = require('./helpers');

async function getData(mapDef) {
    let query = fs.readFileSync(
        path.join(__dirname, './resources/wayNodes.overpassql'),
        'utf8'
    );

    if (mapDef.id) {
        query = query.replace(
            '##AREA##',
            `area:${String(3600000000 + mapDef.id)}`
        );
    } else if (
        !isNaN(mapDef.s) &&
        !isNaN(mapDef.w) &&
        !isNaN(mapDef.n) &&
        !isNaN(mapDef.e)
    ) {
        query = query.replace(
            '##AREA##',
            `${String(mapDef.s)},
        ${String(mapDef.w)},
        ${String(mapDef.n)},
        ${String(mapDef.e)}`
        );
    } else {
        new Error('mapArea specified incorrectly in request');
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

    const resp = await hlp.requestPromise(options);

    return JSON.parse(resp.body);
}

module.exports = getData;
