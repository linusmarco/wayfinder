function buildMap(containerId) {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;

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

    this.scale = 1;

    load().then(() => {
        animate(100);
    });

    async function load() {
        const params = {
            mapArea: {
                id: null,
                s: 38.65,
                w: -75.5,
                n: 38.75,
                e: -75.3
            },
            metric: 'time',
            origins: [
                {
                    name: 'My Origin',
                    rgb: [152, 78, 163],
                    lat: 38.688868,
                    lon: -75.384505
                }
            ],
            numTicks: 300,
            size: {
                width: width,
                height: height,
                margin: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                }
            }
        };

        const data = JSON.parse(await get('/api/walk', params));
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

    function animate(frameRate) {
        drawOrigins(this.origins);

        let curTimeIdx = 0;
        const show = setInterval(() => {
            draw(this.nodeGroups[curTimeIdx], this.origins);
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
        }, frameRate);
    }

    function drawOrigins(origins) {
        origins.forEach(o => {
            context.beginPath();
            context.arc(
                o.loc[0],
                o.loc[1],
                (lineWidth * 4) / this.scale,
                0,
                2 * Math.PI,
                false
            );
            context.fillStyle = o.color;
            context.fill();
            context.lineWidth = 1 / this.scale;
            context.strokeStyle = 'black';
            context.stroke();
        });
    }

    function drawBBox() {
        context.strokeStyle = 'black';
        context.strokeRect(0, 0, width, height);
    }

    function draw(nodes, origins) {
        nodes.forEach(n => {
            context.beginPath();
            context.moveTo(n.pLoc[0], n.pLoc[1]);
            context.lineTo(n.loc[0], n.loc[1]);
            context.strokeStyle = n.color;
            context.lineWidth = lineWidth / this.scale;
            context.lineCap = 'round';
            context.stroke();
        });

        //drawBBox();
        drawOrigins(origins);
    }

    function zoomed() {
        const transform = d3.event.transform;
        this.scale = transform.k;
        context.save();
        context.clearRect(0, 0, width, height);
        context.translate(transform.x, transform.y);
        context.scale(this.scale, this.scale);
        draw(this.nodes, this.origins);
        context.restore();
    }
}

function get(url, params) {
    return new Promise((resolve, reject) => {
        let oReq = new XMLHttpRequest();
        oReq.addEventListener('load', function() {
            resolve(this.responseText);
        });

        const encoded = btoa(JSON.stringify(params));

        oReq.open('GET', `${url}?d=${encoded}`, true);
        oReq.send();
    });
}

buildMap('#viz');
