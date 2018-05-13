function buildMap(containerId) {
    const width = 960;
    const height = 700;

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
            .attr('r', 1.5 / d3.event.transform.k);
    }

    async function draw() {
        const ways = await d3.json('../data/final.json');

        let mercatorProj = d3
            .geoMercator()
            .scale(250000)
            .rotate([71.1434437, 0])
            .center([0, 42.4892843])
            .translate([innerWidth / 2, innerHeight / 2]);

        let geoPath = d3.geoPath().projection(mercatorProj);

        const start = {
            way: 9589326,
            node: 74309086
        };

        start.wayNodeIdx = ways[start.way].findIndex(
            n => n.nodeId === start.node
        );

        walkThisWay(start.way, start.wayNodeIdx, 0);
        console.log('walked');

        const nodes = [];
        Object.keys(ways).forEach(w => {
            ways[w].forEach(n => {
                n.loc = mercatorProj([n.lon, n.lat]);

                g
                    .append('circle')
                    .attr('class', `node node-${n.dist}`)
                    .attr('cx', n.loc[0])
                    .attr('cy', n.loc[1])
                    .attr('r', 1.5)
                    .attr('fill', 'blue')
                    .attr('stroke', 'none')
                    .attr('opacity', 0);

                nodes.push(n);
            });
        });

        nodes.sort((a, b) => d3.ascending(a.dist, b.dist));

        const maxDist = nodes[nodes.length - 1].dist;

        const distScale = d3
            .scaleLinear()
            .domain([0, maxDist])
            .range([50, 100]);

        let curDist = 0;
        const show = setInterval(() => {
            console.log(curDist);

            showNodes(curDist);
            curDist++;

            if (curDist > maxDist) clearInterval(show);
        }, 100);

        function showNodes(dist) {
            g
                .selectAll(`.node-${dist}`)
                .attr('opacity', 1)
                .attr('fill', `hsl(240, 100%, ${distScale(dist)}%)`);
        }

        function walkThisWay(wayId, startIdx, initialDist) {
            if ((ways[wayId][startIdx].dist || Infinity) < initialDist) {
                return;
            }
            ways[wayId][startIdx].dist = initialDist;

            let nextUp = startIdx + 1;
            let nextDown = startIdx - 1;

            let wayNode;

            while ((wayNode = ways[wayId][nextUp])) {
                const dist = initialDist + Math.abs(startIdx - nextUp);

                if ((wayNode.dist || Infinity) < dist) {
                    break;
                }
                wayNode.dist = dist;

                wayNode.ints.forEach(int => {
                    walkThisWay(int.wayId, int.wayNodeIdx, dist);
                });

                nextUp++;
            }

            while ((wayNode = ways[wayId][nextDown])) {
                const dist = initialDist + Math.abs(startIdx - nextDown);

                if ((wayNode.dist || Infinity) < dist) {
                    break;
                }
                wayNode.dist = dist;

                wayNode.ints.forEach(int => {
                    walkThisWay(int.wayId, int.wayNodeIdx, dist);
                });

                nextDown--;
            }
        }
    }

    draw();
}

buildMap('#viz');
