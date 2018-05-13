function buildMap(containerId) {
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

    let svg = d3
        .select(containerId)
        .append('svg')
        .attr('height', height)
        .attr('width', width);

    let g = svg
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    let zoom = d3
        .zoom()
        .scaleExtent([1, 8])
        .on('zoom', zoomed);

    svg.call(
        d3
            .zoom()
            .scaleExtent([1 / 2, 8])
            .on('zoom', zoomed)
    );

    function zoomed() {
        g
            .selectAll('.node')
            .attr('transform', d3.event.transform)
            .attr('stroke-width', lineWidth / d3.event.transform.k);
    }

    async function draw() {
        const ways = await d3.json('../data/final.json');

        let mercatorProj = d3
            .geoMercator()
            .scale(250000)
            .rotate([71.1434437, 0])
            .center([0, 42.4892843])
            .translate([innerWidth / 2, innerHeight / 2]);

        let nodeDist = function(nodeFrom, nodeTo) {
            return (
                d3.geoDistance(
                    [nodeFrom.lon, nodeFrom.lat],
                    [nodeTo.lon, nodeTo.lat]
                ) * 1000000
            );
        };

        const start = {
            way: 9589326,
            node: 74309086
        };

        start.wayNodeIdx = ways[start.way].findIndex(
            n => n.nodeId === start.node
        );

        console.log(start);

        walkThisWay(start.way, start.wayNodeIdx, 0);
        console.log('walked');

        let nodes = [];
        Object.keys(ways).forEach(w => {
            ways[w].forEach(n => {
                n.loc = mercatorProj([n.lon, n.lat]);
                n.pLoc = mercatorProj([n.pLon, n.pLat]);

                if (n.pLon) nodes.push(n);
            });
        });

        const maxDist = d3.max(nodes, n => n.dist);

        console.log(nodes);

        const timeScale = d3
            .scaleQuantize()
            .domain([0, maxDist])
            .range(Array.apply(null, { length: 300 }).map(Number.call, Number));

        const colorScale = d3
            .scaleLinear()
            .domain([0, maxDist])
            .range([50, 100]);

        const lines = g
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('line')
            .attr('class', n => `node node-${timeScale(n.dist)}`)
            .attr('x1', n => n.pLoc[0])
            .attr('y1', n => n.pLoc[1])
            .attr('x2', n => n.loc[0])
            .attr('y2', n => n.loc[1])
            .attr('stroke', n => `hsl(240, 100%, ${colorScale(n.dist)}%)`)
            .attr('stroke-width', lineWidth)
            .attr('opacity', 0);

        let curTime = 0;
        const show = setInterval(() => {
            console.log(curTime);

            showNodes(curTime);
            curTime++;

            if (curTime === 300) clearInterval(show);
        }, 100);

        function showNodes(time) {
            lines.filter(`.node-${time}`).attr('opacity', 1);
        }

        function walkThisWay(wayId, startIdx, initialDist) {
            const startNode = ways[wayId][startIdx];

            if ((startNode.dist || Infinity) < initialDist) {
                return;
            }
            startNode.dist = initialDist;

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

                wayNode.ints.forEach(int => {
                    walkThisWay(int.wayId, int.wayNodeIdx, dist);
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

                wayNode.ints.forEach(int => {
                    walkThisWay(int.wayId, int.wayNodeIdx, dist);
                });

                lastWayNode = wayNode;
                nextDown--;
            }
        }
    }

    draw();
}

buildMap('#viz');
