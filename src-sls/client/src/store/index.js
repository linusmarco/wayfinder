import Vue from 'vue';
import Vuex from 'vuex';

import hlp from '../services/Helpers';

Vue.use(Vuex);

const savedParams = hlp.getUrlParameterByName('saved');

let params;
if (savedParams) {
    params = hlp.urlDecodeObj(savedParams);
    params.origins.forEach(o => {
        if (!o.id) {
            o.id = btoa(String(o.lat) + String(o.lon));
        }
        if (o.hide === 'hide') {
            o.hide = true;
        } else if (o.hide === 'show') {
            o.hide = false;
        }
    });

    if (!params.center) {
        params.center = [
            (Number(params.mapArea.e) + Number(params.mapArea.w)) / 2,
            (Number(params.mapArea.n) + Number(params.mapArea.s)) / 2
        ];
    }
    console.log(params);
} else {
    params = {
        center: [(-71.1036 + -71.119) / 2, (42.3653 + 42.3734) / 2],
        mapArea: {
            id: null,
            s: null,
            w: null,
            n: null,
            e: null,
            scale: null
        },
        metric: 'time',
        origins: [
            {
                id: btoa(String(42.3653) + String(-71.1036)),
                name: 'Central Square T',
                hex: '#ff0000',
                lat: 42.3653,
                lon: -71.1036,
                hide: false
            },
            {
                id: btoa(String(42.3734) + String(-71.119)),
                name: 'Harvard Square T',
                hex: '#0000ff',
                lat: 42.3734,
                lon: -71.119,
                hide: false
            }
        ],
        numTicks: 300,
        size: {
            width: NaN,
            height: NaN,
            margin: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            }
        }
    };
}

export default new Vuex.Store({
    state: {
        params
    },
    mutations: {
        addOrigin(state, origin) {
            state.params.origins.push({
                id: origin.id,
                name: origin.name,
                hex: origin.hex,
                lat: origin.lat,
                lon: origin.lon,
                hide: false
            });
        },
        removeOrigin(state, id) {
            for (let i = 0; i < state.params.origins.length; i++) {
                const o = state.params.origins[i];
                if (o.id === id) {
                    state.params.origins.splice(i, 1);
                    break;
                }
            }
        },
        // toggleOrigin(state, id, hide) {
        //     for (let i = 0; i < state.params.origins.length; i++) {
        //         const o = state.params.origins[i];
        //         if (o.id === id) {
        //             o.hide = hide;
        //             break;
        //         }
        //     }
        // },
        setMetric(state, metric) {
            state.params.metric = metric;
        },
        setArea(state, bounds) {
            state.params.mapArea.n = bounds.n;
            state.params.mapArea.e = bounds.e;
            state.params.mapArea.s = bounds.s;
            state.params.mapArea.w = bounds.w;
            state.params.mapArea.scale = bounds.scale;
        }
    },
    getters: {
        calcParams: state => {
            return JSON.parse(
                JSON.stringify({
                    mapArea: state.params.mapArea,
                    metric: state.params.metric,
                    origins: state.params.origins
                        .filter(o => !o.hide)
                        .map(o => {
                            return {
                                rgb: hlp.hexToRgb(o.hex),
                                id: o.id,
                                lat: o.lat,
                                lon: o.lon
                            };
                        }),
                    numTicks: state.params.numTicks,
                    size: {
                        width: document.getElementById('app').clientWidth,
                        height: document.getElementById('app').clientHeight,
                        margin: state.params.size.margin
                    }
                })
            );
        },
        rawParams: state => state.params
    }
});
