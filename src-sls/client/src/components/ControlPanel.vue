<template>
  <div id="control-panel" ref="root">
    <div ref="head" class="control-panel-head"><span ref="expandToggle" class="expand-toggle" @click="toggleExpand">{{ expanded ? '&minus;' : '+' }}</span></div>
    <div ref="body" class="control-panel-body">
      
      <h3 class="section-title">Map Bounds:</h3>
      <label class="bound-input-label" for="northBoundInput">
        <span>North</span>
        <input v-model="params.mapArea.n" type="number" value="0" step=".0001" min="-90" max="90">
      </label>
      <label class="bound-input-label" for="southBoundInput">
        <span>South</span>
        <input v-model="params.mapArea.s" type="number" value="0" step=".0001" min="-180" max="180">
      </label>
      <label class="bound-input-label" for="eastBoundInput">
        <span>East</span>
        <input v-model="params.mapArea.e" type="number" value="0" step=".0001" min="-90" max="90">
      </label>
      <label class="bound-input-label" for="westBoundInput">
        <span>West</span>
        <input v-model="params.mapArea.w" type="number" value="0" step=".0001" min="-180" max="180">
      </label>
      
      <br>
      
      <h3 class="section-title">Measure proximity by:</h3>
      <div class="dist-metric-radio-group">
        <input v-model="params.metric" type="radio" name="dist-metric" value="time" id="dist-metric-input-time">
        <label class="dist-metric-input-label" for="dist-metric-input-time">Travel Time</label>
        <input v-model="params.metric" type="radio" name="dist-metric" value="dist" id="dist-metric-input-dist">
        <label class="dist-metric-input-label" for="dist-metric-input-dist">Travel Distance</label>
      </div>
      
      <br>

      <h3 class="section-title">Origin points:</h3>
      <div v-for="(origin, i) in params.origins" :key="i" class="origin-point-fieldset-holder">
        <h4 class="section-title">Origin {{ i + 1 }}:</h4>
        <label class="origin-loc-input-label">
          <span>Latitude</span>
          <input v-model="params.origins[i].lat" type="number" value="0">
        </label>
        <label class="origin-loc-input-label">
          <span>Longitude</span>
          <input v-model="params.origins[i].lon" type="number" value="0">
        </label>
      </div>

      <br>

      <div id="add-origin" @click="addOrigin"><span class="big">+ </span><span class="little">Add origin point</span></div>
        
    </div>
    <div @click="mapIt" class="control-panel-foot">
      Map it!
    </div>
  </div>
</template>

<script>
export default {
    name: 'ControlPanel',
    data: () => {
        return {
            expanded: true,
            params: {
                mapArea: {
                    id: null,
                    s: 38.66,
                    w: -75.64,
                    n: 38.96,
                    e: -75.03
                },
                metric: 'time',
                origins: [
                    {
                        name: 'Origin 1',
                        rgb: [166, 86, 40],
                        lat: 38.8,
                        lon: -75.42
                    }
                ],
                numTicks: 300,
                size: {
                    width: document.getElementById('app').clientWidth,
                    height: document.getElementById('app').clientHeight,
                    margin: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    }
                }
            }
        };
    },
    methods: {
        toggleExpand() {
            this.expanded = !this.expanded;

            this.$refs.root.style.height = this.expanded ? '96%' : '4rem';
        },
        addOrigin() {
            this.params.origins.push({
                name: `Origin ${this.params.origins.length}`,
                rgb: [166, 86, 40],
                lat: 0,
                lon: 0
            });
        },
        mapIt() {
            this.$emit('map-it', this.params);
        }
    }
};
</script>

<style scoped>
#control-panel {
    background-color: #fff;
    box-shadow: 0 0 8px 2px #999;

    position: fixed;
    left: 2%;
    top: 2%;

    width: 400px;
    /* height: 500px; */
    height: 96%;
    overflow: hidden;

    transition: height 500ms;
    -webkit-transition: height 500ms;
}

.control-panel-head {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;

    width: calc(100% - 1.5rem);
    height: 4rem;

    background-color: rgb(59, 88, 185);
    color: #eee;

    font-size: 2rem;
    font-weight: bold;

    line-height: 4rem;
    vertical-align: middle;

    padding-left: 1.5rem;
}

.expand-toggle {
    cursor: pointer;
}

.control-panel-body {
    position: absolute;
    bottom: 4rem;
    left: 0;
    z-index: 0;
    overflow-y: auto;
    overflow-x: hidden;

    width: calc(100% - 3rem);
    height: calc(100% - 4rem - 4rem - 3rem);
    padding: 1.5rem;
}

.control-panel-foot {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 0;

    background-color: rgb(236, 216, 28);

    width: 100%;
    height: 4rem;

    font-size: 1.8rem;
    text-align: center;
    line-height: 4rem;

    cursor: pointer;
}

.control-panel-foot:hover {
    background-color: rgb(61, 194, 38);
    color: #eee;
}

.bound-input-label,
.origin-loc-input-label {
    display: block;
    position: relative;
    height: 2rem;
    margin: 0.5rem 60% 0.5rem 1rem;
}

.origin-loc-input-label {
    margin-right: 45%;
}

.bound-input-label input,
.origin-loc-input-label input {
    float: left;
    position: absolute;
    width: calc(65% - 1rem);
    right: 0;
    top: 0;
    bottom: 0;
    padding: 0.5rem;
}

.origin-loc-input-label input {
    width: calc(55% - 1rem);
}

.bound-input-label span,
.origin-loc-input-label span {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    line-height: 2rem;
}

.dist-metric-radio-group input[type='radio'] {
    position: absolute;
    visibility: hidden;
    display: none;
}

.dist-metric-radio-group label {
    display: inline-block;
    cursor: pointer;
    font-weight: bold;
    padding: 5px 20px;
}

.dist-metric-radio-group input[type='radio']:checked + label {
    background: rgb(59, 88, 185);
    color: #eee;
}

.dist-metric-radio-group label + input[type='radio'] + label {
    border-left: solid 2px rgb(59, 88, 185);
    color: rgb(59, 88, 185);
}

.dist-metric-radio-group {
    border: solid 2px rgb(59, 88, 185);
    display: inline-block;
    margin: 20px;
    border-radius: 10px;
    overflow: hidden;
}

.origin-point-fieldset-holder {
    padding-left: 1.5rem;
}

#add-origin {
    height: 3rem;
    width: 14rem;
    margin-left: 3rem;

    background: rgb(59, 88, 185);
    color: #eee;
    border-radius: 1.5rem;

    text-align: center;
    line-height: 3rem;

    cursor: pointer;
}

#add-origin .big {
    font-size: 1.8rem;
    vertical-align: middle;
}

#add-origin .little {
    font-size: 1.2rem;
    vertical-align: middle;
}
</style>
