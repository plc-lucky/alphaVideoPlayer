import AlphaVideoPlayerWebGL from './alphaVideoPlayerWebGL.vue';

// 组件安装函数
const install = (app) => {
  app.component('AlphaVideoPlayerWebGL', AlphaVideoPlayerWebGL);
};

// 支持 Vue.use() 全局安装
AlphaVideoPlayerWebGL.install = install;

export default AlphaVideoPlayerWebGL;
