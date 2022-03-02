<template>
  <img alt="Vue logo" src="../assets/logo.png" />
  <HelloWorld msg="Hello Vue 3.0 + Vite" />
</template>

<script lang="ts">
import { onMounted } from 'vue';
import HelloWorld from '../components/HelloWorld.vue';

export default {
  name: 'App',
  components: {
    HelloWorld,
  },
  setup() {
    // const electron = require('electron');

    onMounted(() => {
      console.log(Date.now() - performance.timing.fetchStart);
    });

    return {};
  },
};
</script>
