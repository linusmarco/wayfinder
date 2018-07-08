import * as d3 from 'd3';
import { Delaunay } from 'd3-delaunay';
import { tile } from 'd3-tile';

export default class DrawService {
    constructor(
        parentId,
        tileContainerId,
        routeContainerId,
        labelContainerId,
        lineWidth,
        frameRate
    ) {
        this.tileSize = 256;
        this.lineWidth = lineWidth || 1.5;
        this.frameRate = frameRate || 50;

        this.parent = document.getElementById(parentId);
        this.tileContainer = document.getElementById(tileContainerId);
        this.routeContainer = document.getElementById(routeContainerId);
        this.labelContainer = document.getElementById(labelContainerId);
        this.width = this.parent.clientWidth;
        this.height = this.parent.clientHeight;

        this.tileSvg = d3
            .select(this.tileContainer)
            .attr('height', this.height)
            .attr('width', this.width);

        this.tileG = this.tileSvg.append('g');

        this.tileDef = tile().size([this.width, this.height]);

        this.zoomDef = d3
            .zoom()
            .scaleExtent([1 << 21, 1 << 23])
            .on('zoom', this.zoomed.bind(this));

        this.canvas = d3
            .select(this.routeContainer)
            .attr('height', this.height)
            .attr('width', this.width);

        this.context = this.canvas.node().getContext('2d');

        this.labelSvg = d3
            .select(this.labelContainer)
            .attr('height', this.height)
            .attr('width', this.width);

        this.labelG = this.labelSvg.append('g');

        this.pi = Math.PI;
        this.tau = 2 * this.pi;

        this.projection = d3
            .geoMercator()
            .scale(1 / this.tau)
            .translate([0, 0]);

        this.scale = 1;
    }

    drawTiles() {
        const center = this.projection([-71.07, 42.38]);

        this.labelSvg.call(this.zoomDef).call(
            this.zoomDef.transform,
            d3.zoomIdentity
                .translate(this.width / 2, this.height / 2)
                .scale(1 << 21)
                .translate(-center[0], -center[1])
        );

        // const that = this;
        // this.labelSvg.on('click', function() {
        //     console.log(that.projection.invert(d3.mouse(this)));
        // });
    }

    getBounds() {
        const beg = this.projection.invert([0, 0]);
        const end = this.projection.invert([this.width, this.height]);

        return {
            id: null,
            n: beg[1],
            e: beg[0],
            s: end[1],
            w: end[0]
        };
    }

    url(d) {
        return `https://api.mapbox.com/v4/mapbox.streets/${d.z}/${d.x}/${
            d.y
        }.png?access_token=pk.eyJ1IjoibG1hcmNvMTYzIiwiYSI6ImNqNm51YTNzdzBjNWkyd28xc3hrMmFiY2YifQ.I0flvL7maPRg65Zi85aW_Q`;
    }

    floor(k) {
        return Math.pow(2, Math.floor(Math.log(k) / Math.LN2));
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

        const areas = this.labelG
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
            .attr('y', d => this.origins[Number(d)].loc[1] - 20)
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
            .attr('y', d => this.origins[Number(d)].loc[1] - 20)
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

    stringify(scale, translate) {
        const k = scale / this.tileSize;
        const r = scale % 1 ? Number : Math.round;
        return (
            'translate(' +
            r(translate[0] * scale) +
            ',' +
            r(translate[1] * scale) +
            ') scale(' +
            k +
            ')'
        );
    }

    zoomed() {
        const transform = d3.event.transform;

        let tiles = this.tileDef
            .scale(transform.k)
            .translate([transform.x, transform.y])();

        this.projection
            .scale(transform.k / this.tau)
            .translate([transform.x, transform.y]);

        let image = this.tileG
            .attr('transform', this.stringify(tiles.scale, tiles.translate))
            .selectAll('image')
            .data(tiles, this.url);

        image.exit().remove();

        image
            .enter()
            .append('image')
            .attr('xlink:href', this.url)
            .attr('x', d => d.x * this.tileSize)
            .attr('y', d => d.y * this.tileSize)
            .attr('width', this.tileSize)
            .attr('height', this.tileSize)
            .style('stroke', 'black');

        this.labelG.attr('transform', transform);

        this.scale = transform.k;
        this.context.save();
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.translate(transform.x, transform.y);
        this.context.scale(this.scale, this.scale);

        if (this.nodes) {
            this.drawAll(this.nodes, this.origins);
            this.drawAreas(this.nodes);
        }

        this.context.restore();
    }
}
