import * as d3 from 'd3';
import { Delaunay } from 'd3-delaunay';
import { tile } from 'd3-tile';

export default class Map {
    constructor(
        parentId,
        tileContainerId,
        routeContainerId,
        labelContainerId,
        store
    ) {
        this.tileSize = 256;
        this.lineWidth = 1.5;
        this.frameRate = 50;
        this.store = store;

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
            .scaleExtent([1 << 18, 1 << 25])
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
        this.areasG = this.labelG.append('g');
        this.originsG = this.labelG.append('g');

        this.pi = Math.PI;
        this.tau = 2 * this.pi;

        this.projection = d3
            .geoMercator()
            .scale(1 / this.tau)
            .translate([0, 0]);

        this.scale = 1;

        this.drawTiles();
        this.handleOrigins();
    }

    handleOrigins() {
        const that = this;
        this.labelSvg.on('click', function() {
            if (d3.select('#edit-box').empty()) {
                const clickPos = d3.mouse(this);
                const clickLoc = that.projection.invert(clickPos);

                const newId = btoa(String(clickLoc[1]) + String(clickLoc[0]));

                that.store.commit('addOrigin', {
                    id: newId,
                    name: 'New Origin',
                    hex: '#0a9115',
                    lat: clickLoc[1],
                    lon: clickLoc[0]
                });

                that.drawOrigins();

                that.editOrigin.bind(that)(
                    d3.select(`#${newId.replace(/\W/g, '')}`)
                );
            } else {
                d3.select('#edit-box').remove();
            }
        });
    }

    editOrigin(origin) {
        const that = this;

        const originX = origin.attr('cx');
        const originY = origin.attr('cy');

        const data = origin.datum();

        const editBox = d3
            .select(this.parent)
            .style('position', 'relative')
            .append('div')
            .attr('id', 'edit-box')
            .style('z-index', 3)
            .style('position', 'absolute')
            .style('left', `${originX - 150}px`)
            .style('top', `${originY - 110}px`)
            .style('width', '300px')
            .style('height', '100px')
            .style('background-color', '#fff')
            .style('box-shadow', '0 0 4px 1px #999')
            .on('click', function() {
                d3.event.stopPropagation();
            });

        editBox
            .append('span')
            .style('text-align', 'center')
            .style('position', 'absolute')
            .style('left', '10px')
            .style('top', '10px')
            .style('width', '30px')
            .style('height', '30px')
            .style('line-height', '30px')
            .style('border', '1px solid black')
            .style('background-color', 'rgb(197, 19, 19)')
            .style('color', '#fff')
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .style('cursor', 'pointer')
            .html('&times;')
            .on('click', function() {
                d3.event.stopPropagation();

                that.store.commit('removeOrigin', data.id);
                that.drawOrigins();

                editBox.remove();
            });

        editBox
            .append('span')
            .style('text-align', 'center')
            .style('position', 'absolute')
            .style('left', '10px')
            .style('bottom', '10px')
            .style('width', '30px')
            .style('height', '30px')
            .style('line-height', '30px')
            .style('border', '1px solid black')
            .style('background-color', 'rgb(15, 145, 31)')
            .style('color', '#fff')
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .style('cursor', 'pointer')
            .html('&#10004;')
            .on('click', function() {
                d3.event.stopPropagation();

                that.store.commit('removeOrigin', data.id);
                that.store.commit('addOrigin', {
                    id: data.id,
                    name: editBox.select('#name-input').node().value,
                    hex: editBox.select('#color-input').node().value,
                    lat: data.lat,
                    lon: data.lon,
                    hide: editBox.select('#hide-input').property('checked')
                });

                that.drawOrigins();

                editBox.remove();
            });

        editBox
            .append('input')
            .attr('id', 'name-input')
            .attr('type', 'text')
            .attr('value', data.name)
            .attr('placeholder', 'Name')
            .style('text-align', 'center')
            .style('position', 'absolute')
            .style('right', '10px')
            .style('top', '10px')
            .style('width', '236px')
            .style('height', '28px')
            .style('border', '1px solid black')
            .style('font-size', '16px');

        editBox
            .append('input')
            .attr('id', 'color-input')
            .attr('type', 'color')
            .attr('value', data.hex)
            .style('position', 'absolute')
            .style('left', '52px')
            .style('bottom', '10px')
            .style('width', '100px')
            .style('height', '28px')
            .style('border', '1px solid black');

        const hideLabel = editBox
            .append('label')
            .attr('for', 'show-hide')
            .attr('display', 'block')
            .style('position', 'absolute')
            .style('right', '10px')
            .style('bottom', '10px')
            .style('width', '100px')
            .style('height', '28px');

        hideLabel
            .append('input')
            .attr('id', 'hide-input')
            .property('checked', data.hide === true)
            .attr('name', 'show-hide')
            .attr('type', 'checkbox')
            .style('height', '28px')
            .style('margin', '0')
            .style('float', 'left');

        hideLabel
            .append('span')
            .style('height', '28px')
            .style('line-height', '28px')
            .style('font-size', '16px')
            .style('margin-left', '6px')
            .style('float', 'left')
            .html('Hide');
    }

    drawOrigins() {
        const that = this;

        const origins = this.originsG
            .selectAll('.origin')
            .data(this.store.state.params.origins, d => d.id);

        origins.exit().remove();

        origins
            .enter()
            .append('circle')
            .attr('id', d => d.id.replace(/\W/g, ''))
            .attr('class', 'origin')
            .attr('cx', d => this.projection([d.lon, d.lat])[0])
            .attr('cy', d => this.projection([d.lon, d.lat])[1])
            .attr('r', 6)
            .attr('fill', d => (d.hide === true ? 'grey' : d.hex))
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5)
            .on('click', function() {
                d3.event.stopPropagation();

                d3.select('#edit-box').remove();
                that.editOrigin.bind(that)(d3.select(this));
            });

        origins
            .attr('cx', d => this.projection([d.lon, d.lat])[0])
            .attr('cy', d => this.projection([d.lon, d.lat])[1])
            .attr('r', 6)
            .attr('fill', d => (d.hide === true ? 'grey' : d.hex));
    }

    drawTiles() {
        const center = this.projection(this.store.state.params.center);

        this.labelSvg.call(this.zoomDef).call(
            this.zoomDef.transform,
            d3.zoomIdentity
                .translate(this.width / 2, this.height / 2)
                .scale(1 << 23)
                .translate(-center[0], -center[1])
        );
    }

    getBounds() {
        const beg = this.projection.invert([0, 0]);
        const end = this.projection.invert([this.width, this.height]);

        return {
            id: null,
            n: beg[1],
            e: end[0],
            s: end[1],
            w: beg[0],
            scale: this.projection.scale()
        };

        // console.log(bounds);
        // console.log(this.projection.scale(), this.projection.translate());
        // this.setBounds(bounds);

        // return bounds;
    }

    // setBounds(bounds) {
    //     const path = d3.geoPath().projection(this.projection);

    //     const pts = path.bounds({
    //         type: 'FeatureCollection',
    //         features: [
    //             {
    //                 type: 'Feature',
    //                 geometry: {
    //                     type: 'Point',
    //                     coordinates: [bounds.w, bounds.n]
    //                 }
    //             },
    //             {
    //                 type: 'Feature',
    //                 geometry: {
    //                     type: 'Point',
    //                     coordinates: [bounds.e, bounds.s]
    //                 }
    //             }
    //         ]
    //     });

    //     console.log(path(pts));

    //     var corners = path.bounds(pts),
    //         dx = corners[1][0] - corners[0][0],
    //         dy = corners[1][1] - corners[0][1],
    //         x = (corners[0][0] + corners[1][0]) / 2,
    //         y = (corners[0][1] + corners[1][1]) / 2,
    //         scale = 1 / Math.max(dx / this.width, dy / this.height),
    //         translate = [
    //             this.width / 2 - scale * x,
    //             this.height / 2 - scale * y
    //         ];

    //     var transform = d3.zoomIdentity
    //         .translate(translate[0], translate[1])
    //         .scale(scale);

    //     console.log(bounds, corners, transform);

    //     // this.labelSvg.call(this.zoomDef).call(
    //     //     this.zoomDef.transform,
    //     //     d3.zoomIdentity
    //     //         .translate(this.width / 2, this.height / 2)
    //     //         .scale(1 << 23)
    //     //         .translate(-center[0], -center[1])
    //     // );
    // }

    url(d) {
        // return `https://api.mapbox.com/v4/mapbox.streets/${d.z}/${d.x}/${
        //     d.y
        // }.png?access_token=pk.eyJ1IjoibG1hcmNvMTYzIiwiYSI6ImNqNm51YTNzdzBjNWkyd28xc3hrMmFiY2YifQ.I0flvL7maPRg65Zi85aW_Q`;
        return `https://maps.wikimedia.org/osm-intl/${d.z}/${d.x}/${d.y}.png`;
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
            n.pos = this.projection.invert(n.loc);
            n.pPos = this.projection.invert(n.pLoc);
            this.nodeGroups[n.timeIdx].push(n);
        });

        this.origins.forEach(o => {
            o.pos = this.projection.invert(o.loc);
        });

        this.context.clearRect(0, 0, this.width, this.height);

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

        const areas = this.areasG
            .selectAll('.area')
            .data(Object.keys(origins), d => Number(d));

        // exit
        areas.exit().remove();

        //update
        areas
            .select('path')
            .attr('fill', d => this.origins[Number(d)].color)
            .attr('d', d => origins[d].path.toString());

        areas
            .selectAll('text')
            .attr('x', d => this.origins[Number(d)].loc[0])
            .attr('y', d => this.origins[Number(d)].loc[1] - 20)
            .text(d => this.origins[Number(d)].name);

        // enter
        const enter = areas
            .enter()
            .append('g')
            .attr('class', 'area')
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

        enter
            .append('path')
            .attr('stroke', 'none')
            .attr('fill', d => this.origins[Number(d)].color)
            .style('opacity', 0)
            .attr('d', d => origins[d].path.toString());

        enter
            .append('text')
            .attr('class', 'text-background')
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

        enter
            .append('text')
            .attr('class', 'text-foreground')
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

    drawBBox() {
        this.context.strokeStyle = 'black';
        this.context.strokeRect(0, 0, this.width, this.height);
    }

    drawAll(nodes, origins, color) {
        nodes.forEach(n => {
            if (n.loc && n.pLoc) {
                this.context.beginPath();
                this.context.moveTo(n.pLoc[0], n.pLoc[1]);
                this.context.lineTo(n.loc[0], n.loc[1]);
                this.context.strokeStyle =
                    color === false ? '#c6c6c6' : n.color;
                this.context.lineWidth = this.lineWidth;
                this.context.lineCap = 'round';
                this.context.stroke();
            }
        });
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

        this.store.commit('setArea', this.getBounds());

        this.scale = transform.k;
        this.context.save();
        this.context.clearRect(0, 0, this.width, this.height);

        if (this.nodes) {
            this.nodes.forEach(n => {
                n.loc = this.projection(n.pos);
                n.pLoc = this.projection(n.pPos);
            });

            this.origins.forEach(o => {
                o.loc = this.projection(o.pos);
            });

            this.drawAll(this.nodes, this.origins);
            this.drawAreas(this.nodes);
        }

        this.drawOrigins();

        this.context.restore();
    }
}
