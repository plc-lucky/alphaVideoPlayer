import vue from 'rollup-plugin-vue';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';

const external = ['vue'];
const globals = {
  vue: 'Vue'
};

export default [
  // ES Module build
  {
    input: 'components/alphaVideoPlayer/index.js',
    external,
    output: {
      file: 'dist/alphaVideoPlayer.esm.js',
      format: 'es',
      globals,
    },
    plugins: [
      vue({
        css: false,           // 禁用Vue插件的CSS提取功能
        compileTemplate: true, // 启用模板编译
        preprocessStyles: true
      }),
      postcss({
        extract: false,  // 不提取CSS为单独文件
        inject: true,    // 将CSS注入到JavaScript中
        minimize: true   // 压缩CSS代码
      }),
      nodeResolve(),
      commonjs()
    ]
  },
  // UMD build
  {
    input: 'components/alphaVideoPlayer/index.js',
    external,
    output: {
      file: 'dist/alphaVideoPlayer.js',
      format: 'umd',
      name: 'AlphaVideoPlayerWebGL',
      globals
    },
    plugins: [
      vue({
        css: false,
        compileTemplate: true,
        preprocessStyles: true
      }),
      postcss({
        extract: false,
        inject: true,
        minimize: true
      }),
      nodeResolve(),
      commonjs(),
      terser()
    ]
  },
  // Minified UMD build
  {
    input: 'components/alphaVideoPlayer/index.js',
    external,
    output: {
      file: 'dist/alphaVideoPlayer.min.js',
      format: 'umd',
      name: 'AlphaVideoPlayerWebGL',
      globals
    },
    plugins: [
      vue({
        css: false,
        compileTemplate: true,
        preprocessStyles: true
      }),
      postcss({
        extract: false,
        inject: true,
        minimize: true
      }),
      nodeResolve(),
      commonjs(),
      terser({
        compress: {
          drop_console: true
        }
      })
    ]
  }
];
