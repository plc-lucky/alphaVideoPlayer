import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// vite打包不干净，使用rollup打包，并且处理css内联到js文件中

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8090,
  },
});
