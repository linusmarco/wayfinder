const fs = require('fs');
const d3 = require('d3');

const width = 960;
const height = 700;

const lineWidth = 1.5;

const margin = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
};

const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const ways = require('../data/final.json');

let mercatorProj = d3
    .geoMercator()
    .scale(250000)
    .rotate([71.1434437, 0])
    .center([0, 42.4892843])
    .translate([innerWidth / 2, innerHeight / 2]);

let nodeDist = function(nodeFrom, nodeTo) {
    return (
        d3.geoDistance([nodeFrom.lon, nodeFrom.lat], [nodeTo.lon, nodeTo.lat]) *
        1000000
    );
};

const origins = [
    {
        way: 9589326,
        node: 74309086
    },
    {
        way: 9589254,
        node: 74351803
    },
    {
        way: 74585100,
        node: 542893399
    }
];

origins.forEach(s => {
    s.wayNodeIdx = ways[s.way].findIndex(n => n.nodeId === s.node);
});

origins.forEach((o, i) => {
    walkThisWay(o.way, o.wayNodeIdx, 0, i);
    console.log(`walked ${i}`);
});

let nodes = [];
Object.keys(ways).forEach(w => {
    ways[w].forEach(n => {
        n.loc = mercatorProj([n.lon, n.lat]);
        n.pLoc = mercatorProj([n.pLon, n.pLat]);

        if (n.pLon) nodes.push(n);
    });
});

const maxDist = d3.max(nodes, n => n.dist);

const timeScale = d3
    .scaleQuantize()
    .domain([0, maxDist])
    .range(Array.apply(null, { length: 300 }).map(Number.call, Number));

const colors = d3.scaleOrdinal([240, 0, 30, 280, 320]);

const colorScale = d3
    .scaleLinear()
    .domain([0, maxDist])
    .range([50, 100]);

nodes.forEach(n => {
    n.time = timeScale(n.dist);
    n.color = `hsl(${colors(n.originId)}, 100%, ${colorScale(n.dist)}%)`;
});

nodes.sort((a, b) => d3.ascending(a.dist, b.dist));

fs.writeFileSync('../data/walked.json', JSON.stringify(nodes));

function walkThisWay(wayId, startIdx, initialDist, originId) {
    const startNode = ways[wayId][startIdx];

    if ((startNode.dist || Infinity) < initialDist) {
        return;
    }
    startNode.dist = initialDist;
    startNode.originId = originId;

    let nextUp = startIdx + 1;
    let nextDown = startIdx - 1;

    let wayNode, lastWayNode;

    lastWayNode = startNode;
    while ((wayNode = ways[wayId][nextUp])) {
        const dist = lastWayNode.dist + nodeDist(lastWayNode, wayNode);

        if ((wayNode.dist || Infinity) < dist) {
            break;
        }
        wayNode.dist = dist;
        wayNode.pLon = lastWayNode.lon;
        wayNode.pLat = lastWayNode.lat;
        wayNode.originId = originId;

        wayNode.ints.forEach(int => {
            walkThisWay(int.wayId, int.wayNodeIdx, dist, originId);
        });

        lastWayNode = wayNode;
        nextUp++;
    }

    lastWayNode = startNode;
    while ((wayNode = ways[wayId][nextDown])) {
        const dist = lastWayNode.dist + nodeDist(lastWayNode, wayNode);

        if ((wayNode.dist || Infinity) < dist) {
            break;
        }
        wayNode.dist = dist;
        wayNode.pLon = lastWayNode.lon;
        wayNode.pLat = lastWayNode.lat;
        wayNode.originId = originId;

        wayNode.ints.forEach(int => {
            walkThisWay(int.wayId, int.wayNodeIdx, dist, originId);
        });

        lastWayNode = wayNode;
        nextDown--;
    }
}
