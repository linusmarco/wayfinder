const path = require('path');

const hlp = require('./helpers');

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

function parseData(rawData, trimArea) {
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

                if (trimArea) {
                    const inArea = lastWay.nodeDetails.map(n =>
                        hlp.pointInBox(n, trimArea)
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
                        maxspeed: hlp.parseSpeed(
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

    return nodes;
}

module.exports = parseData;
