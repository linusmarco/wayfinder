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
        const nodes = await d3.json('../data/walked.json');

        const lines = g
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('line')
            .attr('class', n => `node node-${n.time}`)
            .attr('x1', n => n.pLoc[0])
            .attr('y1', n => n.pLoc[1])
            .attr('x2', n => n.loc[0])
            .attr('y2', n => n.loc[1])
            .attr('stroke', n => n.color)
            .attr('stroke-width', lineWidth)
            .attr('opacity', 0);

        let curTime = 0;
        const show = setInterval(() => {
            console.log(curTime);

            showNodes(curTime);
            curTime++;

            if (curTime === 300) clearInterval(show);
        }, 50);

        function showNodes(time) {
            lines.filter(`.node-${time}`).attr('opacity', 1);
        }
    }

    draw();
}

buildMap('#viz');
