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
    context.fillStyle = '#bbb';
    context.fillRect(0, 0, width, height);

    load().then(animate);

    async function load() {
        const data = await d3.json('../data/walked.json');
        const nodes = data.nodes;
        const origins = data.origins;

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
        this.origins = origins;
        this.maxTimeIdx = maxTimeIdx;
    }

    function animate() {
        drawOrigins(this.origins);

        let curTimeIdx = 0;
        const show = setInterval(() => {
            console.log(curTimeIdx);

            draw(this.nodeGroups[curTimeIdx]);
            drawOrigins(this.origins);
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

    function drawOrigins(origins) {
        origins.forEach(o => {
            context.beginPath();
            context.arc(
                o.loc[0],
                o.loc[1],
                lineWidth * 4,
                0,
                2 * Math.PI,
                false
            );
            context.fillStyle = o.color;
            context.fill();
            context.lineWidth = 1;
            context.strokeStyle = 'black';
            context.stroke();
        });
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
        context.fillStyle = '#bbb';
        context.fillRect(0, 0, width, height);
        draw(this.nodes);
        drawOrigins(this.origins);
        context.restore();
    }
}

buildMap('#viz');
