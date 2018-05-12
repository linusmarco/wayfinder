const fs = require('fs');
const path = require('path');

const rawData = JSON.parse(fs.readFileSync('../data/raw.json', 'utf8'));

let ways = [];
let nodes = [];

rawData.elements.forEach((d, i) => {
    if (d.type === 'way') {
        if (i !== 0) {
            const lastWay = ways[ways.length - 1];
            lastWay.nodes.forEach((n, j) => {
                nodes.push({
                    wayId: lastWay.id,
                    nodeId: n.id,
                    wayNodeIdx: j,
                    lat: n.lat,
                    lon: n.lon
                });
            });
        }

        d.nodes = [];
        ways.push(d);
    } else {
        ways[ways.length - 1].nodes.push({
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
