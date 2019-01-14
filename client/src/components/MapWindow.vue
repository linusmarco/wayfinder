<template>
    <div id="map-window">
        <svg id="tile-holder"></svg>
        <canvas id="route-canvas"></canvas>
        <svg id="label-holder"></svg>
        <div id="map-it-button" @click="mapIt">Map it!</div>
    </div>
</template>

<script>
import Map from '../services/Map';

export default {
    name: 'MapWindow',
    data: () => {
        return {
            map: {}
        };
    },
    methods: {
        setup() {
            this.map = new Map(
                'map-window',
                'tile-holder',
                'route-canvas',
                'label-holder',
                this.$store
            );

            // this.drawService.drawTiles();
        },
        update(data) {
            this.map.draw(data);
        },
        mapIt() {
            this.$emit('map-it');
        }
    }
};
</script>

<style scoped>
#map-window,
#tile-holder,
#route-canvas,
#label-holder {
    position: fixed;
    left: 0;
    top: 0;

    cursor: default;
}

#map-window {
    width: 100%;
    height: 100%;
}

#tile-holder {
    z-index: 0;
}

#route-canvas {
    z-index: 1;
}

#label-holder {
    z-index: 2;
}

#map-it-button {
    width: 140px;
    height: 50px;
    line-height: 50px;
    z-index: 3;

    position: absolute;
    right: 10px;
    bottom: 10px;
    background-color: rgb(236, 216, 28);
    color: #222;
    box-shadow: 0 0 4px 1px #999;
    border-radius: 2px;
    font-size: 18px;
    font-weight: bold;

    text-align: center;

    cursor: pointer;
}
</style>
