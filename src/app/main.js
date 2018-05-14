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

    const canvas = d3
        .select(containerId)
        .append('canvas')
        .attr('height', height)
        .attr('width', width);

    const context = canvas.node().getContext('2d');

    load().then(animate);

    async function load() {
        const nodes = await d3.json('../data/walked.json');

        const maxTimeIdx = nodes[nodes.length - 1].timeIdx;

        const allTimeIdxs = Array.apply(null, { length: maxTimeIdx + 1 }).map(
            Number.call,
            Number
        );
        const nodeGroups = {};
        allTimeIdxs.forEach(t => (nodeGroups[t] = []));

        nodes.forEach(n => {
            nodeGroups[n.timeIdx].push(n);
        });

        this.nodeGroups = nodeGroups;
        this.nodes = nodes;
        this.maxTimeIdx = maxTimeIdx;
    }

    function animate() {
        let curTimeIdx = 0;
        const show = setInterval(() => {
            console.log(curTimeIdx);

            draw(this.nodeGroups[curTimeIdx]);
            curTimeIdx++;

            if (curTimeIdx === maxTimeIdx + 1) {
                clearInterval(show);

                canvas.call(
                    d3
                        .zoom()
                        .scaleExtent([1 / 2, 8])
                        .on('zoom', zoomed.bind(this))
                );
            }
        }, 50);
    }

    function draw(nodes) {
        nodes.forEach(n => {
            context.beginPath();
            context.moveTo(n.pLoc[0], n.pLoc[1]);
            context.lineTo(n.loc[0], n.loc[1]);
            context.strokeStyle = n.color;
            context.lineWidth = lineWidth;
            context.stroke();
        });
    }

    function zoomed() {
        const transform = d3.event.transform;
        context.save();
        context.clearRect(0, 0, width, height);
        context.translate(transform.x, transform.y);
        context.scale(transform.k, transform.k);
        draw(this.nodes);
        context.restore();
    }
}

buildMap('#viz');
