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
        3959
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

const by = 'time';

origins.forEach(s => {
    s.wayNodeIdx = ways[s.way].findIndex(n => n.nodeId === s.node);
});

origins.forEach((o, i) => {
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

if (by === 'dist') {
    maxDist = d3.max(nodes, n => n.dist);

    timeIdxScale = d3
        .scaleQuantize()
        .domain([0, maxDist])
        .range(Array.apply(null, { length: 300 }).map(Number.call, Number));

    colorScale = d3
        .scaleLinear()
        .domain([0, maxDist])
        .range([50, 100]);
} else if (by === 'time') {
    maxTime = d3.max(nodes, n => n.time);

    timeIdxScale = d3
        .scaleQuantize()
        .domain([0, maxTime])
        .range(Array.apply(null, { length: 300 }).map(Number.call, Number));

    colorScale = d3
        .scaleLinear()
        .domain([0, maxTime])
        .range([50, 100]);
} else {
    console.error(`invalid 'by': ${by}`);
}

nodes.forEach(n => {
    n.timeIdx = timeIdxScale(by === 'dist' ? n.dist : n.time);
    n.color = `hsl(${colors(n.originId)}, 100%, ${colorScale(
        by === 'dist' ? n.dist : n.time
    )}%)`;
});

nodes.sort((a, b) => {
    if (by === 'dist') return d3.ascending(a.dist, b.dist);
    else return d3.ascending(a.time, b.time);
});

fs.writeFileSync('../data/walked.json', JSON.stringify(nodes));

function walkThisWay(wayId, startIdx, initialDist, initialTime, originId) {
    const startNode = ways[wayId][startIdx];

    let alreadyCloser;
    if (by === 'dist') {
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
        if (by === 'dist') {
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
        if (by === 'dist') {
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
