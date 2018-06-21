import * as d3 from 'd3';

export default class DrawService {
    constructor(containerId, lineWidth, frameRate) {
        // this.containerId = containerId;
        this.lineWidth = lineWidth || 1.5;
        this.frameRate = frameRate || 50;

        this.container = document.getElementById(containerId);
        this.width = this.container.clientWidth;
        this.height = this.container.clientWidth;

        this.canvas = d3
            .select(this.container)
            .append('canvas')
            .attr('height', this.height)
            .attr('width', this.width);

        this.context = this.canvas.node().getContext('2d');

        this.scale = 1;
    }

    draw(data) {
        this.nodes = data.nodes;
        this.origins = data.origins;

        this.maxTimeIdx = this.nodes[this.nodes.length - 1].timeIdx;

        const allTimeIdxs = Array.apply(null, {
            length: this.maxTimeIdx + 1
        }).map(Number.call, Number);
        this.nodeGroups = {};
        allTimeIdxs.forEach(t => (this.nodeGroups[t] = []));

        this.nodes.forEach(n => {
            this.nodeGroups[n.timeIdx].push(n);
        });

        this.context.clearRect(0, 0, this.width, this.height);

        this.animate();
    }

    animate() {
        this.drawOrigins(this.origins);

        let curTimeIdx = 0;
        const show = setInterval(() => {
            this.drawAll(this.nodeGroups[curTimeIdx], this.origins);
            curTimeIdx++;

            if (curTimeIdx === this.maxTimeIdx + 1) {
                clearInterval(show);

                this.canvas.call(
                    d3
                        .zoom()
                        .scaleExtent([1 / 2, 8])
                        .on('zoom', this.zoomed.bind(this))
                );
            }
        }, this.frameRate || 50);
    }

    drawOrigins(origins) {
        origins.forEach(o => {
            this.context.beginPath();
            this.context.arc(
                o.loc[0],
                o.loc[1],
                this.lineWidth * 4 / this.scale,
                0,
                2 * Math.PI,
                false
            );
            this.context.fillStyle = o.color;
            this.context.fill();
            this.context.lineWidth = 1 / this.scale;
            this.context.strokeStyle = 'black';
            this.context.stroke();
        });
    }

    drawBBox() {
        this.context.strokeStyle = 'black';
        this.context.strokeRect(0, 0, this.width, this.height);
    }

    drawAll(nodes, origins) {
        nodes.forEach(n => {
            this.context.beginPath();
            this.context.moveTo(n.pLoc[0], n.pLoc[1]);
            this.context.lineTo(n.loc[0], n.loc[1]);
            this.context.strokeStyle = n.color;
            this.context.lineWidth = this.lineWidth / this.scale;
            this.context.lineCap = 'round';
            this.context.stroke();
        });

        // this.drawBBox();
        this.drawOrigins(origins);
    }

    zoomed() {
        const transform = d3.event.transform;
        this.scale = transform.k;
        this.context.save();
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.translate(transform.x, transform.y);
        this.context.scale(this.scale, this.scale);
        this.drawAll(this.nodes, this.origins);
        this.context.restore();
    }
}
