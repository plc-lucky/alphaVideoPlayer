import AlphaPlayerWebgl from "./alpha-player-webgl.vue";

// 组件安装函数
const install = (app) => {
  app.component("AlphaPlayerWebgl", AlphaPlayerWebgl);
};

// 支持 Vue.use() 全局安装
AlphaPlayerWebgl.install = install;

export default AlphaPlayerWebgl;
