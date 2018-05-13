const fs = require('fs');
const path = require('path');

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

            lastWay.nodeDetails.forEach((n, j) => {
                nodes.push({
                    wayId: lastWay.id,
                    nodeId: n.id,
                    wayNodeIdx: j,
                    lat: n.lat,
                    lon: n.lon
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
