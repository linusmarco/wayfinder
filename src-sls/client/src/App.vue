<template>
    <div id="app">
        <ControlPanel ref="controlPanel" @map-it="processRequest" />
        <LoadingScreen ref="loadingScreen" />
        <MessageBox ref="messageBox" />
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

            this.$refs.loadingScreen.toggleVisibility(
                '(Step 1 of 4) Loading raw map data'
            );

            const encodedArea = hlp.urlEncodeObj(mapParams.mapArea);
            const encodedFull = hlp.urlEncodeObj(mapParams);
            let qParams = [
                {
                    key: 'area',
                    value: encodedArea
                },
                {
                    key: 'params',
                    value: encodedFull
                },
                {
                    key: 'reqNo',
                    value: 0
                }
            ];

            let response, stage;
            let tries = 0;
            let errors = 0;
            while (stage !== 'walkedData') {
                await hlp.wait(1000 * Math.pow(2, tries));
                const rawResponse = await this.dataService.get(
                    '/api/poll',
                    qParams
                );

                qParams.filter(p => p.key === 'reqNo')[0].value++;

                response = JSON.parse(rawResponse.responseText);

                if (response.progress === stage) {
                    tries++;
                } else {
                    tries = 0;
                }

                if (errors > 1 || tries > 5) {
                    break;
                }

                stage = response.progress;

                let message = 'Loading';
                switch (response.progress) {
                    case 'noData':
                        message = '(Step 1 of 4) Loading raw map data';
                        break;
                    case 'rawData':
                        message = '(Step 2 of 4) Processing map data';
                        break;
                    case 'parsedData':
                        message = '(Step 3 of 4) Finding intersections';
                        break;
                    case 'mergedData':
                        message = '(Step 4 of 4) Finding routes';
                        break;
                    case 'walkedData':
                        message = '(Step 4 of 4) Finding routes';
                        break;
                    default:
                        errors++;
                        break;
                }
                this.$refs.loadingScreen.setMessage(message);
            }

            if (errors > 1 || tries > 5) {
                this.$refs.loadingScreen.toggleVisibility();

                this.$refs.messageBox.open(
                    {
                        label: 'ERROR: ',
                        message:
                            'Something went wrong when processing your request'
                    },
                    'rgb(197, 19, 19)'
                );
            } else {
                const dataResp = await this.dataService.get(
                    response.walkedUrl,
                    []
                );
                const data = JSON.parse(dataResp.responseText);

                this.$refs.loadingScreen.toggleVisibility();

                history.pushState(
                    {},
                    document.title,
                    `?saved=${hlp.urlEncodeObj(rawParams)}`
                );

                this.$refs.controlPanel.toggleExpand(false);

                this.$refs.messageBox.open({
                    label: 'HINT: ',
                    message:
                        'Copy the new URL in the address bar and use it to come back to this exact map!'
                });

                this.drawService.draw(data);
            }
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

#app canvas,
#app svg {
    position: fixed;
    left: 0;
    top: 0;
}

#app canvas {
    z-index: 0;
}

#app svg {
    z-index: 1;
    cursor: default;
}

#app #control-panel {
    z-index: 2;
}

#app #message-box {
    z-index: 3;
}
</style>
