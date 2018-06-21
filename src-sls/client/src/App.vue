<template>
  <div id="app">
    <ControlPanel @map-it="processRequest"/>
    <!-- {{ params }} -->
  </div>
</template>

<script>
import DataService from './services/DataService';
import DrawService from './services/DrawService';

import ControlPanel from './components/ControlPanel.vue';

export default {
    name: 'app',
    data: () => {
        return {
            params: {}
        };
    },
    mounted() {
        this.drawService = new DrawService('app');
        this.dataService = new DataService();
    },
    components: {
        ControlPanel
    },
    methods: {
        async processRequest(params) {
            this.params = params;
            console.log(params);
            const data = await this.dataService.getData(params);
            this.drawService.draw(data);
        }
    }
};
</script>

<style>
html,
body,
#app {
    font-family: 'Open Sans', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #222;
    font-size: 12px;
    margin: 0;
    padding: 0;
    border: 0;
    overflow: hidden;
    width: 100%;
    height: 100%;
}
</style>
