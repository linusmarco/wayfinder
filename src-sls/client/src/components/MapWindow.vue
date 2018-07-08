<template>
    <div id="map-window">
        <svg id="tile-holder"></svg>
        <canvas id="route-canvas"></canvas>
        <svg id="label-holder"></svg>
    </div>
</template>

<script>
import DrawService from '../services/DrawService';

export default {
    name: 'MapWindow',
    data: () => {
        return {};
    },
    methods: {
        setup() {
            this.drawService = new DrawService(
                'map-window',
                'tile-holder',
                'route-canvas',
                'label-holder'
            );

            this.drawService.drawTiles();
        },
        update() {}
    }
};
</script>

<style scoped>
#map-window,
#tile-holder,
#routes-canvas,
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

#routes-canvas {
    z-index: 0;
}
</style>
