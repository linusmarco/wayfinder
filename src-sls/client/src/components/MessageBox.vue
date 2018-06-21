<template>
  <div id="message-box" :style="`bottom: ${hidden ? '-4rem' : '0'}`">
      <div class="close-button" @click="close">&times;</div>
      <p ref="message" class="message-holder">
          <span class="label">{{ label }}</span>
          <span class="message">{{ message }}</span> 
      </p>
  </div>
</template>

<script>
export default {
    name: 'LoadingScreen',
    data: () => {
        return {
            hidden: true,
            label: '',
            message: ''
        };
    },
    methods: {
        open(message, color) {
            this.label = message.label;
            this.message = message.message;
            this.$refs.message.style.color = color ? color : '#222';
            this.hidden = false;
        },
        close() {
            this.hidden = true;
            this.message = '';
        }
    }
};
</script>

<style scoped>
#message-box {
    background-color: #fff;
    box-shadow: 0 0 4px 1px #999;

    position: fixed;
    left: 0;
    right: 0;
    margin: 0 10% 0 calc(2% + 400px + 10%);

    height: 4rem;
    overflow: hidden;

    background-color: #fff;
    box-shadow: 0 0 4px 1px #999;

    transition: bottom 300ms;
}

.close-button {
    float: left;
    width: 3rem;
    height: 3rem;

    margin: 0;
    padding: 0.5rem;
    border-right: 1px solid #bbb;

    font-size: 2rem;
    text-align: center;
    line-height: 3rem;
    vertical-align: middle;

    cursor: pointer;
}

.close-button:hover {
    background-color: #bbb;
}

.message-holder {
    margin: 0 0 0 4rem;
    padding: 0 2rem;

    text-align: center;
    line-height: 4rem;
    vertical-align: middle;
}

.label {
    font-weight: bold;
}
</style>
