const fs = require('fs');
const path = require('path');

const defaultSpeeds = {
    living_street: '15 mph',
    motorway_link: '30 mph',
    motorway: '60 mph',
    platform: '15 mph',
    primary_link: '30 mph',
    primary: '60 mph',
    raceway: '60 mph',
    residential: '25 mph',
    road: '25 mph',
    secondary_link: '30 mph',
    secondary: '30 mph',
    tertiary_link: '30 mph',
    tertiary: '30 mph',
    trunk: '55 mph',
    trunk_link: '30 mph',
    unclassified: '25 mph'
};

const config = require('../config.json');

const rawData = JSON.parse(fs.readFileSync('../data/raw.json', 'utf8'));

let ways = [];
let nodes = [];

rawData.elements.forEach((d, i) => {
    if (d.type === 'way') {
        if (i !== 0) {
            const lastWay = ways[ways.length - 1];

            lastWay.nodeDetails.sort((a, b) => {
                const idxA = lastWay.nodes.indexOf(a.id);
                const idxB = lastWay.nodes.indexOf(b.id);

                if (idxA === -1) console.error(`missing node : ${a.id}`);
                if (idxB === -1) console.error(`missing node : ${b.id}`);

                if (idxA > idxB) return 1;
                else if (idxA < idxB) return -1;
                else return 0;
            });

            if (!config.mapArea.id) {
                const inArea = lastWay.nodeDetails.map(n =>
                    pointInBox(n, config.mapArea)
                );

                lastWay.nodeDetails = lastWay.nodeDetails.slice(
                    inArea.indexOf(true),
                    inArea.lastIndexOf(true) + 1
                );
            }

            lastWay.nodeDetails.forEach((n, j) => {
                nodes.push({
                    wayId: lastWay.id,
                    nodeId: n.id,
                    wayNodeIdx: j,
                    lat: n.lat,
                    lon: n.lon,
                    maxspeed: parseSpeed(
                        n.maxspeed ||
                            lastWay.tags.maxspeed ||
                            defaultSpeeds[lastWay.tags.highway]
                    ),
                    highway: lastWay.tags.highway
                });
            });
        }

        d.nodeDetails = [];
        ways.push(d);
    } else {
        ways[ways.length - 1].nodeDetails.push({
            id: d.id,
            lat: d.lat,
            lon: d.lon
        });
    }
});

fs.writeFileSync('../data/ways.json', JSON.stringify(ways));
fs.writeFileSync('../data/nodes.json', JSON.stringify(nodes));

console.log(`
ways: ${ways.length}
nodes: ${nodes.length}
`);

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
