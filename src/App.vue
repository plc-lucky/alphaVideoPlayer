<template>
  <div>
    <div v-for="item in srcList" :key="item.url">
      <AlphaVideoPlayerWebGL style="width: 200px;" :src="item.url" />
    </div>
  </div>
</template>

<script setup lang="ts">
import AlphaVideoPlayerWebGL from "../components/alphaVideoPlayer/alphaVideoPlayerWebGL.vue";

const srcList = [
  {
    url: "https://hw-img.wemogu.net/video/20250729/21ea18688ff59b7860c6178aafcc599d.mp4",
    name: "示例视频 1",
  },
  {
    url: "https://hw-img.wemogu.net/video/20250808/d6aff98d5e3d0b7384816f2239658e58.mp4",
    name: "示例视频 2",
  },
];
</script>
