<template>
  <div id="loading-screen" :style="`display: ${hidden ? 'none' : 'block'}`">
      <div class="message-holder">
          <p class="text-main">{{ message }}{{ dots }}</p>
          <p class="text-secondary">(this may take up to a couple minutes for large areas)</p>
      </div>
  </div>
</template>

<script>
export default {
    name: 'LoadingScreen',
    data: () => {
        return {
            hidden: true,
            message: 'Loading',
            dots: ''
        };
    },
    methods: {
        toggleVisibility() {
            this.hidden = !this.hidden;

            if (!this.hidden) {
                this.loadingInt = setInterval(() => {
                    const newDots = this.dots + '.';
                    if (this.dots.length >= 3) {
                        this.dots = '';
                    } else {
                        this.dots = newDots;
                    }
                }, 600);
            } else {
                this.dots = '';
                clearInterval(this.loadingInt);
            }
        }
    }
};
</script>

<style scoped>
#loading-screen {
    position: fixed;
    margin: 0;
    padding: 0;
    border: 0;
    overflow: hidden;
    width: 100%;
    height: 100%;
    z-index: 999;

    background-color: rgba(50, 50, 50, 0.8);
}

.message-holder {
    position: absolute;
    left: 30%;
    right: 30%;
    top: 40%;
    bottom: 40%;

    background-color: #eee;
    box-shadow: 0 0 8px 2px #444;

    text-align: center;
}

.message-holder .text-main {
    height: 3rem;
    width: 50%;
    line-height: 3rem;
    vertical-align: middle;

    position: absolute;
    top: calc(50% - 1.2rem);
    left: calc(50% - 4rem);
    margin: -1.5rem 0 0 0;

    font-size: 1.8rem;
    text-align: left;
}

.message-holder .text-secondary {
    height: 3rem;
    width: 80%;
    line-height: 3rem;
    vertical-align: middle;

    position: absolute;
    top: calc(50% + 1.2rem);
    left: 50%;
    margin: -1.5rem 0 0 -40%;

    font-size: 1.2rem;
}
</style>
