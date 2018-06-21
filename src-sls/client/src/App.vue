<template>
  <div id="app">
    <ControlPanel @map-it="processRequest"/>
    <LoadingScreen ref="loadingScreen"/>
    <MessageBox ref="messageBox"/>
  </div>
</template>

<script>
import hlp from './services/Helpers';
import DataService from './services/DataService';
import DrawService from './services/DrawService';

import ControlPanel from './components/ControlPanel.vue';
import LoadingScreen from './components/LoadingScreen.vue';
import MessageBox from './components/MessageBox.vue';

export default {
    name: 'app',
    data: () => {
        return {
            ready: false
        };
    },
    mounted() {
        this.drawService = new DrawService('app');
        this.dataService = new DataService();

        this.ready = true;
    },
    components: {
        ControlPanel,
        LoadingScreen,
        MessageBox
    },
    methods: {
        async processRequest(mapParams, rawParams) {
            while (!this.ready) {
                await hlp.wait(10);
            }

            this.$refs.loadingScreen.toggleVisibility();
            const data = await this.dataService.getData(mapParams);
            // await hlp.wait(500);
            this.$refs.loadingScreen.toggleVisibility();

            const qParam = hlp.urlEncodeObj(rawParams);
            history.pushState({}, document.title, `?saved=${qParam}`);
            this.$refs.messageBox.open({
                label: 'HINT: ',
                message:
                    'Copy the new URL in the address bar and use it to come back to this exact map!'
            });

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
