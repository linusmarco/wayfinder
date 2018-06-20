const d3 = require('d3');

function walk(data, origins, metric, numTicks, size) {
    const width = size.width;
    const height = size.height;
    const margin = size.margin;

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const geoJSON = {
        type: 'FeatureCollection',
        features: []
    };

    Object.keys(data).forEach(w => {
        data[w].forEach(n => {
            geoJSON.features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [n.lon, n.lat]
                }
            });
        });
    });

    let mercatorProj = d3
        .geoMercator()
        .fitSize([innerWidth, innerHeight], geoJSON);

    Object.keys(data).forEach(w => {
        data[w].forEach(n => {
            origins.forEach((o, i) => {
                const dist = nodeDist(o, n);
                if (o.dist === undefined || dist < o.dist) {
                    o.dist = dist;
                    o.way = w;
                    o.node = n.nodeId;
                    o.loc = mercatorProj([n.lon, n.lat]);
                    o.color = d3
                        .hsl(`rgb(${o.rgb[0]}, ${o.rgb[1]}, ${o.rgb[2]})`)
                        .toString();
                }
            });
        });
    });

    origins.forEach(o => {
        o.wayNodeIdx = data[o.way].findIndex(n => n.nodeId === o.node);
    });

    const walks = [];

    origins.forEach((o, i) => {
        walks.push([data, o.way, o.wayNodeIdx, 0, 0, i, walks, metric]);

        data[o.way][o.wayNodeIdx].ints.forEach(int => {
            walks.push([
                data,
                int.wayId,
                int.wayNodeIdx,
                0,
                0,
                i,
                walks,
                metric
            ]);
        });
    });

    let walksDone = 0;
    data['dupes'] = [];
    while (walks.length > 0) {
        walkThisWay(...walks[0]);
        walksDone++;
        walks.shift();
    }

    let nodes = [];
    Object.keys(data).forEach(w => {
        data[w].forEach(n => {
            n.loc = mercatorProj([n.lon, n.lat]);
            n.pLoc = mercatorProj([n.pLon, n.pLat]);

            n.lastWayNodeId = String(n.lastWayNodeId);
            n.lastWayId = String(n.lastWayId);
            n.nodeId = String(n.nodeId);
            n.wayId = String(n.wayId);

            n.pathId = [
                [n.wayId, n.nodeId].join('-'),
                [n.lastWayId, n.lastWayNodeId].join('-')
            ]
                .sort()
                .join('-');

            if (n.pLon) nodes.push(n);
        });
    });

    nodes = _.orderBy(
        nodes,
        ['pathId', config.colorBy === 'dist' ? 'dist' : 'time'],
        ['asc', 'asc']
    );

    nodes = _.sortedUniqBy(nodes, 'pathId');

    let maxDist, maxTime, timeIdxScale, fadeScale;

    if (metric === 'dist') {
        maxDist = d3.max(nodes, n => n.dist);

        timeIdxScale = d3
            .scaleQuantize()
            .domain([0, maxDist])
            .range(
                Array.apply(null, { length: numTicks }).map(Number.call, Number)
            );

        fadeScale = d3
            .scaleLinear()
            .domain([0, maxDist])
            .range([0, 1]);
    } else if (metric === 'time') {
        maxTime = d3.max(nodes, n => n.time);

        timeIdxScale = d3
            .scaleQuantize()
            .domain([0, maxTime])
            .range(
                Array.apply(null, { length: numTicks }).map(Number.call, Number)
            );

        fadeScale = d3
            .scaleLinear()
            .domain([0, maxTime])
            .range([0, 1]);
    } else {
        console.error(`invalid 'by': ${metric}`);
    }

    nodes.forEach((n, i, a) => {
        const origin = origins[n.originId];

        n.timeIdx = timeIdxScale(metric === 'dist' ? n.dist : n.time);

        const color = d3.hsl(origin.color);
        const fadedAmt = fadeScale(metric === 'dist' ? n.dist : n.time);
        color.l = color.l + (1 - color.l) * fadedAmt;
        n.color = color.toString();

        a[i] = _.pick(n, [
            'loc',
            'pLoc',
            'timeIdx',
            'color',
            metric === 'dist' ? 'dist' : 'time'
        ]);
    });

    nodes.sort((a, b) => {
        if (metric === 'dist') return d3.ascending(a.dist, b.dist);
        else return d3.ascending(a.time, b.time);
    });

    return {
        origins: origins,
        nodes: nodes
    };
}

function nodeDist(nodeFrom, nodeTo) {
    return (
        d3.geoDistance([nodeFrom.lon, nodeFrom.lat], [nodeTo.lon, nodeTo.lat]) *
        3959
    );
}

function walkThisWay(
    ways,
    wayId,
    startIdx,
    initialDist,
    initialTime,
    originId,
    queue,
    metric
) {
    const startNode = ways[wayId][startIdx];

    let alreadyCloser, alreadyClosest;
    if (metric === 'dist') {
        alreadyClosest = startNode.dist === 0;
        alreadyCloser = (startNode.dist || Infinity) <= initialDist;
        alreadyCloser = alreadyCloser || alreadyClosest;
    } else {
        alreadyClosest = startNode.time === 0;
        alreadyCloser = (startNode.time || Infinity) <= initialTime;
        alreadyCloser = alreadyCloser || alreadyClosest;
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

        let alreadyCloser, alreadyClosest;
        if (metric === 'dist') {
            alreadyClosest = wayNode.dist === 0;
            alreadyCloser = (wayNode.dist || Infinity) <= dist;
            alreadyCloser = alreadyCloser || alreadyClosest;
        } else {
            alreadyClosest = wayNode.time === 0;
            alreadyCloser = (wayNode.time || Infinity) <= time;
            alreadyCloser = alreadyCloser || alreadyClosest;
        }

        if (alreadyCloser) {
            const dupe = Object.assign({}, wayNode);

            dupe.dist = dist;
            dupe.time = time;
            dupe.pLon = lastWayNode.lon;
            dupe.pLat = lastWayNode.lat;
            dupe.originId = originId;
            dupe.lastWayNodeId = lastWayNode.nodeId;
            dupe.lastWayId = lastWayNode.wayId;

            ways['dupes'].push(dupe);
            break;
        }

        wayNode.dist = dist;
        wayNode.time = time;
        wayNode.pLon = lastWayNode.lon;
        wayNode.pLat = lastWayNode.lat;
        wayNode.originId = originId;
        wayNode.lastWayNodeId = lastWayNode.nodeId;
        wayNode.lastWayId = lastWayNode.wayId;

        wayNode.ints.forEach(int => {
            queue.push([
                ways,
                int.wayId,
                int.wayNodeIdx,
                dist,
                time,
                originId,
                queue,
                metric
            ]);
        });

        lastWayNode = wayNode;
        nextUp++;
    }

    lastWayNode = startNode;
    while ((wayNode = ways[wayId][nextDown])) {
        const thisDist = nodeDist(lastWayNode, wayNode);
        const dist = lastWayNode.dist + thisDist;
        const time = lastWayNode.time + thisDist / wayNode.maxspeed;

        let alreadyCloser, alreadyClosest;
        if (metric === 'dist') {
            alreadyClosest = wayNode.dist === 0;
            alreadyCloser = (wayNode.dist || Infinity) <= dist;
            alreadyCloser = alreadyCloser || alreadyClosest;
        } else {
            alreadyClosest = wayNode.time === 0;
            alreadyCloser = (wayNode.time || Infinity) <= time;
            alreadyCloser = alreadyCloser || alreadyClosest;
        }

        if (alreadyCloser) {
            const dupe = Object.assign({}, wayNode);

            dupe.dist = dist;
            dupe.time = time;
            dupe.pLon = lastWayNode.lon;
            dupe.pLat = lastWayNode.lat;
            dupe.originId = originId;
            dupe.lastWayNodeId = lastWayNode.nodeId;
            dupe.lastWayId = lastWayNode.wayId;

            ways['dupes'].push(dupe);
            break;
        }

        wayNode.dist = dist;
        wayNode.time = time;
        wayNode.pLon = lastWayNode.lon;
        wayNode.pLat = lastWayNode.lat;
        wayNode.originId = originId;
        wayNode.lastWayNodeId = lastWayNode.nodeId;
        wayNode.lastWayId = lastWayNode.wayId;

        wayNode.ints.forEach(int => {
            queue.push([
                ways,
                int.wayId,
                int.wayNodeIdx,
                dist,
                time,
                originId,
                queue,
                metric
            ]);
        });

        lastWayNode = wayNode;
        nextDown--;
    }
}

module.exports = walk;
