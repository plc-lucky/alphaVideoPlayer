<template>
  <div ref="videoShader" class="shader_video_player_webgl">
    <!-- 隐藏的视频元素，用作纹理源 -->
    <video
      ref="videoElement"
      class="hidden-video"
      crossorigin="anonymous"
      muted
      :loop="videoLoop"
      preload="metadata"
      playsinline
      @loadeddata="onVideoLoaded"
      @loadedmetadata="onVideoMetadataLoaded"
      @play="onVideoPlay"
      @pause="onVideoPause"
      @ended="onVideoEnded"
      @error="onVideoError"
    >
      <source :src="src" type="video/mp4" />
      您的设备不支持视频播放
    </video>

    <!-- WebGL 渲染容器 -->
    <div ref="canvasContainer" class="canvas-container">
      <!--loading-->
      <div v-if="!isVideoLoaded" class="loading">
        <slot name="loading">
          <i class="loading-spinner"></i>
          <p class="loading_text">动效加载中...</p>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed, onMounted } from "vue";
import { NativeWebGLVideoPlayer } from "./NativeWebGLVideoPlayer.js";

const props = defineProps({
  src: String,
  autoplay: {
    type: Boolean,
    default: true,
  },
  // 播放次数
  loop: {
    type: Number,
    default: 0, // 0 为无限
  },
});

// 响应式数据
const videoShader = ref(null); // Shader播放器容器
const canvasContainer = ref(null); // Canvas容器
const videoElement = ref(null); // 视频元素
const isVideoLoaded = ref(false); // 视频是否已加载
const isVideoPlaying = ref(false); // 视频是否正在播放
const isPageVisible = ref(true); // 页面是否可见

const emit = defineEmits(["pause", "play", "stop", "ended", "load"]);

// 如果loop为0，则无限循环
const videoLoop = computed(() => props.loop === 0);

// WebGL 相关变量
let webglPlayer = null;

/**
 * 视频加载完成回调
 */
const onVideoLoaded = () => {
  if (isVideoLoaded.value) return;
  isVideoLoaded.value = true;

  try {
    // 初始化原生WebGL播放器
    webglPlayer = new NativeWebGLVideoPlayer(
      canvasContainer.value,
      videoElement.value,
    );

    emit("load"); // 原生WebGL场景初始化完成
    // 计算并设置响应式尺寸
    const { width, height } = calculateResponsiveSize();
    webglPlayer.resize(width, height);

    // 初始渲染一帧以显示视频的第一帧
    webglPlayer.render();

    if (props.autoplay) {
      playVideo();
    }
  } catch (error) {
    console.error("WebGL初始化失败:", error);
  }
};

const onVideoPlay = () => {
  isVideoPlaying.value = true;
  // 视频开始播放时启动渲染循环
  if (webglPlayer && isPageVisible.value) {
    webglPlayer.startRenderLoop();
  }
  emit("play");
};

const onVideoPause = () => {
  isVideoPlaying.value = false;
  // 视频暂停时停止渲染循环
  if (webglPlayer) {
    webglPlayer.stopRenderLoop();
  }
  emit("pause");
};

// 播放次数
let videoPlayCount = 1;

// 视频播放结束回调
const onVideoEnded = () => {
  isVideoPlaying.value = false;
  if (props.loop > 0 && videoPlayCount < props.loop) {
    videoPlayCount++;
    videoElement.value?.play();
    return;
  }
  // 视频播放结束
  videoPlayCount = 1;
  if (webglPlayer) {
    webglPlayer.stopRenderLoop();
  }
  emit("ended");
};

/**
 * 视频元数据加载完成回调 (iOS兼容)
 */
const onVideoMetadataLoaded = () => {
  // iOS设备可能只触发这个事件，需要主动设置第一帧，触发loadeddata事件
  if (!videoElement.value || isVideoLoaded.value) return;
  // 设置视频到第一帧
  videoElement.value.currentTime = 0.1; // 稍微往后一点，避免0秒的问题
};

/**
 * 视频加载错误回调
 */
const onVideoError = (event) => {
  console.error("视频加载失败:", event);
};

/**
 * 计算适合容器的响应式尺寸
 */
const calculateResponsiveSize = () => {
  const defaultWidth = 375;
  if (!videoElement.value || !videoShader.value) {
    return { width: defaultWidth, height: defaultWidth / 2 }; // 默认尺寸
  }

  // 获取父容器(.shader_video_player_webgl)的实际宽度
  const rootWidth = videoShader.value.clientWidth || defaultWidth;

  // 获取视频的实际宽高（因为video元素display:none，不能用offsetWidth/offsetHeight）
  const originalVideoWidth = videoElement.value.videoWidth;
  const originalVideoHeight = videoElement.value.videoHeight;

  if (!originalVideoWidth || !originalVideoHeight) {
    return { width: rootWidth, height: rootWidth * 0.75 }; // 默认4:3比例
  }

  // 由于视频是左右拼接的格式（左边alpha，右边RGB），实际显示宽度是一半
  const actualWidth = originalVideoWidth / 2;

  // 计算视频的宽高比 (width/height)
  const aspectRatio = actualWidth / originalVideoHeight;

  // 以容器宽度为准，按宽高比计算对应的高度
  const finalHeight = rootWidth / aspectRatio;

  return {
    width: Math.round(rootWidth),
    height: Math.round(finalHeight),
  };
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 重置场景
 */
const resetPlay = async () => {
  if (!videoElement.value) return;

  // 停止渲染循环
  isVideoPlaying.value = false;
  if (webglPlayer) {
    webglPlayer.stopRenderLoop();
  }

  videoPlayCount = 1; // 重置播放次数

  // 重置视频到开始位置
  videoElement.value.currentTime = 0;
  // 等待视频重置到第一帧后再渲染
  await sleep(50);
  videoElement.value.pause();
  webglPlayer && webglPlayer.render(); // 确保在视频帧更新后渲染
  emit("stop");
};

/**
 * 清理资源
 */
const cleanup = () => {
  // 清理WebGL资源
  if (webglPlayer) {
    webglPlayer.dispose();
    webglPlayer = null;
  }

  // 暂停视频
  if (videoElement.value) {
    videoElement.value.pause();
  }
};

const playVideo = () => {
  if (!videoElement.value) return;
  videoElement.value.play();
};

const pauseVideo = () => {
  if (!videoElement.value) return;
  videoElement.value.pause();
};

// 页面可见性处理
const handleVisibilityChange = () => {
  isPageVisible.value = !document.hidden;

  if (webglPlayer) {
    // 当页面重新可见且视频正在播放时，重启渲染循环
    if (isPageVisible.value && isVideoPlaying.value) {
      webglPlayer.startRenderLoop();
    } else if (!isPageVisible.value) {
      // 页面不可见时停止渲染循环以节省资源
      webglPlayer.stopRenderLoop();
    }
  }
};

// 窗口尺寸变化处理
const handleResize = () => {
  if (webglPlayer && isVideoLoaded.value) {
    const { width, height } = calculateResponsiveSize();
    webglPlayer.resize(width, height);
  }
};

onMounted(() => {
  // 监听页面可见性变化
  document.addEventListener("visibilitychange", handleVisibilityChange);
  // 监听窗口尺寸变化
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("resize", handleResize);
  cleanup();
});

// 暴露给父组件的方法
defineExpose({
  play: playVideo,
  pause: pauseVideo,
  reset: resetPlay,
});
</script>

<style scoped lang="less">
.shader_video_player_webgl {
  .hidden-video {
    display: none;
  }

  .canvas-container {
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(0, 0, 0, 0.6);
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.3);
        border-top: 4px solid #000000;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    }
  }
}
</style>
