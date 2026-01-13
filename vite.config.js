import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { tmpdir } from 'os';
import { devLogger } from '@meituan-nocode/vite-plugin-dev-logger';
import {
  devHtmlTransformer,
  prodHtmlTransformer,
} from '@meituan-nocode/vite-plugin-nocode-html-transformer';
import react from '@vitejs/plugin-react';

const CHAT_VARIABLE = process.env.CHAT_VARIABLE || '';
const PUBLIC_PATH = process.env.PUBLIC_PATH || '';

const isProdEnv = process.env.NODE_ENV === 'production';
// const publicPath = (isProdEnv && CHAT_VARIABLE)
//   ? PUBLIC_PATH + '/' + CHAT_VARIABLE
//   : PUBLIC_PATH + '/';
const publicPath = '/travelAgent/';

// const outDir = (isProdEnv && CHAT_VARIABLE) ? 'build/' + CHAT_VARIABLE : 'build' ;
const outDir = 'docs';

async function loadPlugins() {
  const plugins = isProdEnv
  ? CHAT_VARIABLE
    ? [react(), prodHtmlTransformer(CHAT_VARIABLE)]
    : [react()]
  : [
      // devLogger({
      //   dirname: resolve(tmpdir(), '.nocode-dev-logs'),
      //   maxFiles: '3d',
      // }),
      react(),
      // devHtmlTransformer(CHAT_VARIABLE),
    ];

  if (process.env.NOCODE_COMPILER_PATH) {
    const { componentCompiler } = await import(process.env.NOCODE_COMPILER_PATH);
    plugins.push(componentCompiler());
  }
  return plugins;
}

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const plugins = await loadPlugins();
  
  return {
    server: {
      host: '::',
      port: '8080',
      hmr: {
        overlay: false,
      },
       proxy: {
      // 捕获以 /api 开头的请求
      '/travelapi': {
        target: 'http://124.71.176.26:8000/', // 这里必须是你 Python 后端运行的地址和端口
        changeOrigin: true,
        // 如果你的后端代码里路由本身就包含 /api (如 @app.post("/api/chat/stream"))
        // 就不需要 rewrite。如果后端是 @app.post("/chat/stream")，则需要去掉 /api
        // 根据你提供的后端代码，这里不需要 rewrite
      }
    }
    },
    plugins,
    base: publicPath,
    build: {
      outDir,
    },
    resolve: {
      alias: [
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
        {
          find: 'lib',
          replacement: resolve(__dirname, 'lib'),
        },
      ],
    },
  };
});
