<script setup>
import { ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">You've clicked this {{ count }} times.</button>
  </div>

  <p>
    Need a hand? Check out Defang's 
    <a href="https://defang.io/samples" target="_blank"
      >samples</a
    > to get started!
  </p>

</template>
