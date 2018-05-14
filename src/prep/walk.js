const fs = require('fs');
const d3 = require('d3');

const config = require('../config.json');

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

const rawNodes = require('../data/nodes.json');

const geoJSON = {
    type: 'FeatureCollection',
    features: rawNodes.map(n => {
        config.origins.forEach(o => {
            const dist = nodeDist(o, n);
            if (o.dist === undefined || dist < o.dist) {
                o.dist = dist;
                o.way = n.wayId;
                o.node = n.nodeId;
            }
        });

        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [n.lon, n.lat]
            }
        };
    })
};

let mercatorProj = d3
    .geoMercator()
    .rotate([71.1434437, 0])
    .center([0, 42.4892843])
    .fitSize([innerWidth, innerHeight], geoJSON);

config.origins.forEach(o => {
    o.wayNodeIdx = ways[o.way].findIndex(n => n.nodeId === o.node);
});

config.origins.forEach((o, i) => {
    walkThisWay(o.way, o.wayNodeIdx, 0, 0, i);
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

const colors = d3.scaleOrdinal([240, 0, 30, 280, 320]);

let maxDist, maxTime;

let timeIdxScale, colorScale;

if (config.colorBy === 'dist') {
    maxDist = d3.max(nodes, n => n.dist);

    timeIdxScale = d3
        .scaleQuantize()
        .domain([0, maxDist])
        .range(
            Array.apply(null, { length: config.numTicks }).map(
                Number.call,
                Number
            )
        );

    colorScale = d3
        .scaleLinear()
        .domain([0, maxDist])
        .range([50, 100]);
} else if (config.colorBy === 'time') {
    maxTime = d3.max(nodes, n => n.time);

    timeIdxScale = d3
        .scaleQuantize()
        .domain([0, maxTime])
        .range(
            Array.apply(null, { length: config.numTicks }).map(
                Number.call,
                Number
            )
        );

    colorScale = d3
        .scaleLinear()
        .domain([0, maxTime])
        .range([50, 100]);
} else {
    console.error(`invalid 'by': ${config.colorBy}`);
}

nodes.forEach(n => {
    n.timeIdx = timeIdxScale(config.colorBy === 'dist' ? n.dist : n.time);
    n.color = `hsl(${colors(n.originId)}, 100%, ${colorScale(
        config.colorBy === 'dist' ? n.dist : n.time
    )}%)`;
});

nodes.sort((a, b) => {
    if (config.colorBy === 'dist') return d3.ascending(a.dist, b.dist);
    else return d3.ascending(a.time, b.time);
});

fs.writeFileSync('../data/walked.json', JSON.stringify(nodes, null, 4));

function nodeDist(nodeFrom, nodeTo) {
    return (
        d3.geoDistance([nodeFrom.lon, nodeFrom.lat], [nodeTo.lon, nodeTo.lat]) *
        3959
    );
}

function walkThisWay(wayId, startIdx, initialDist, initialTime, originId) {
    const startNode = ways[wayId][startIdx];

    let alreadyCloser;
    if (config.colorBy === 'dist') {
        alreadyCloser = (startNode.dist || Infinity) < initialDist;
    } else {
        alreadyCloser = (startNode.time || Infinity) < initialTime;
    }

    if (alreadyCloser) {
        return;
    }
    startNode.dist = initialDist;
    startNode.time = initialTime;
    startNode.originId = originId;

    let nextUp = startIdx + 1;
    let nextDown = startIdx - 1;

    let wayNode, lastWayNode;

    lastWayNode = startNode;
    while ((wayNode = ways[wayId][nextUp])) {
        const thisDist = nodeDist(lastWayNode, wayNode);
        const dist = lastWayNode.dist + thisDist;
        const time = lastWayNode.time + thisDist / wayNode.maxspeed;

        let alreadyCloser;
        if (config.colorBy === 'dist') {
            alreadyCloser = (wayNode.dist || Infinity) < dist;
        } else {
            alreadyCloser = (wayNode.time || Infinity) < time;
        }

        if (alreadyCloser) {
            break;
        }
        wayNode.dist = dist;
        wayNode.time = time;
        wayNode.pLon = lastWayNode.lon;
        wayNode.pLat = lastWayNode.lat;
        wayNode.originId = originId;

        wayNode.ints.forEach(int => {
            walkThisWay(int.wayId, int.wayNodeIdx, dist, time, originId);
        });

        lastWayNode = wayNode;
        nextUp++;
    }

    lastWayNode = startNode;
    while ((wayNode = ways[wayId][nextDown])) {
        const thisDist = nodeDist(lastWayNode, wayNode);
        const dist = lastWayNode.dist + thisDist;
        const time = lastWayNode.time + thisDist / wayNode.maxspeed;

        let alreadyCloser;
        if (config.colorBy === 'dist') {
            alreadyCloser = (wayNode.dist || Infinity) < dist;
        } else {
            alreadyCloser = (wayNode.time || Infinity) < time;
        }

        if (alreadyCloser) {
            break;
        }
        wayNode.dist = dist;
        wayNode.time = time;
        wayNode.pLon = lastWayNode.lon;
        wayNode.pLat = lastWayNode.lat;
        wayNode.originId = originId;

        wayNode.ints.forEach(int => {
            walkThisWay(int.wayId, int.wayNodeIdx, dist, time, originId);
        });

        lastWayNode = wayNode;
        nextDown--;
    }
}
