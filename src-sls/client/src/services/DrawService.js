import * as d3 from 'd3';
import { Delaunay } from 'd3-delaunay';

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

        this.svg = d3
            .select(this.container)
            .append('svg')
            .attr('height', this.height)
            .attr('width', this.width);

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

        this.drawAll(this.nodes, this.origins, false);

        this.animate();
    }

    drawAreas(nodes) {
        const origins = {};
        nodes.forEach(n => {
            const originId = String(n.originId);
            if (origins[originId]) {
                origins[originId].pts.push(n.loc);
            } else {
                origins[originId] = {
                    color: n.color,
                    pts: [n.loc]
                };
            }
        });

        Object.keys(origins).forEach(o => {
            const path = d3.path();
            const { hull, triangles, points } = Delaunay.from(origins[o].pts);
            const n = hull.length;
            let i0,
                i1 = triangles[hull[n - 1]] * 2;
            for (let i = 0; i < n; ++i) {
                (i0 = i1), (i1 = triangles[hull[i]] * 2);
                if (i === 0) path.moveTo(points[i0], points[i0 + 1]);
                else path.lineTo(points[i1], points[i1 + 1]);
            }
            path.closePath();

            origins[String(o)].path = path;
        });

        const areas = this.svg
            .selectAll('.area')
            .data(Object.keys(origins))
            .enter()
            .append('g')
            .on('mouseover', function() {
                d3.select(this)
                    .select('path')
                    .style('opacity', 0.3);
                d3.select(this)
                    .selectAll('text')
                    .style('opacity', 1);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .select('path')
                    .style('opacity', 0);
                d3.select(this)
                    .selectAll('text')
                    .style('opacity', 0);
            });

        areas
            .append('path')
            .attr('stroke', 'none')
            .attr('fill', d => this.origins[Number(d)].color)
            .style('opacity', 0)
            .attr('d', d => origins[d].path.toString());

        areas
            .append('text')
            .attr('x', d => this.origins[Number(d)].loc[0])
            .attr('y', d => this.origins[Number(d)].loc[1] - 15)
            .attr('stroke', 'white')
            .attr('stroke-width', '0.2rem')
            .attr('fill', 'white')
            .attr('dominant-baseline', 'central')
            .attr('text-anchor', 'middle')
            .style('opacity', 0)
            .style('font-size', '1.3rem')
            .style('font-weight', 'bold')
            .text(d => this.origins[Number(d)].name);

        areas
            .append('text')
            .attr('x', d => this.origins[Number(d)].loc[0])
            .attr('y', d => this.origins[Number(d)].loc[1] - 15)
            .attr('stroke', 'none')
            .attr('fill', 'black')
            .attr('dominant-baseline', 'central')
            .attr('text-anchor', 'middle')
            .style('opacity', 0)
            .style('font-size', '1.3rem')
            .style('font-weight', 'bold')
            .text(d => this.origins[Number(d)].name);
    }

    animate() {
        this.drawOrigins(this.origins);

        let curTimeIdx = 0;
        const show = setInterval(() => {
            this.drawAll(this.nodeGroups[curTimeIdx], this.origins);
            curTimeIdx++;

            if (curTimeIdx === this.maxTimeIdx + 1) {
                clearInterval(show);

                this.drawAreas(this.nodes);

                this.canvas.call(
                    d3
                        .zoom()
                        .scaleExtent([1 / 2, 8])
                        .on('zoom', this.zoomed.bind(this))
                );
            }
        }, this.frameRate);
    }

    drawOrigins(origins) {
        origins.forEach(o => {
            this.context.beginPath();
            this.context.arc(
                o.loc[0],
                o.loc[1],
                (this.lineWidth * 4) / this.scale,
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

    drawAll(nodes, origins, color) {
        nodes.forEach(n => {
            this.context.beginPath();
            this.context.moveTo(n.pLoc[0], n.pLoc[1]);
            this.context.lineTo(n.loc[0], n.loc[1]);
            this.context.strokeStyle = color === false ? '#c6c6c6' : n.color;
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
        this.drawAreas(this.nodes);
        this.context.restore();
    }
}
