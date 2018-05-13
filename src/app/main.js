function buildMap(containerId) {
    // size globals
    const width = 960;
    const height = 700;

    const margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    };

    // calculate dimensions without margins
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // create svg element
    let svg = d3
        .select(containerId)
        .append('svg')
        .attr('height', height)
        .attr('width', width);

    // create inner group element
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
            .attr('r', 2 / d3.event.transform.k);
        // .style('font-size', 10 / d3.event.transform.k);
    }

    // read in our data
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

        let usedNodes = [];

        // const node = ways[start.way].find(n => n.nodeId === start.node);

        // let nodes = [];

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
                    .attr('r', 2)
                    .attr('fill', 'blue')
                    .attr('stroke', 'none')
                    .attr('opacity', 0);

                // g
                //     .append('text')
                //     .attr('class', `node node-${n.dist}`)
                //     .attr('x', n.loc[0])
                //     .attr('y', n.loc[1])
                //     .attr('text-anchor', 'middle')
                //     .attr('dominant-baseline', 'middle')
                //     .attr('fill', 'black')
                //     .attr('stroke', 'none')
                //     .style('font-size', 10)
                //     // .attr('opacity', 0)
                //     .attr('opacity', 1)
                //     .text(n.dist);

                nodes.push(n);
            });
        });

        nodes.sort((a, b) => d3.ascending(a.dist, b.dist));
        console.log(nodes);

        const maxDist = nodes[nodes.length - 1].dist;
        console.log(maxDist);

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

        // Object.keys(ways).forEach(w => {
        //     ways[w].forEach(n => {
        //         const pt = mercatorProj([n.lon, n.lat]);

        //         g
        //             .append('circle')
        //             .attr('cx', pt[0])
        //             .attr('cy', pt[1])
        //             .attr('r', 2)
        //             .style('fill', 'black')
        //             .style('stroke', 'none');
        //     });
        // });
    }

    draw();
}

buildMap('#viz');
