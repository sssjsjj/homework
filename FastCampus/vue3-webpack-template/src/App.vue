<template>
  <h1>{{ message }} </h1>
  <hello-world />
</template>

<script>
import HelloWorld from '~/components/HelloWorld'
export default {
  components: {
    HelloWorld
  },
  data() {
    return {
      message: 'hello vue'
    }
  }
}
</script>

<style scoped>
</style>