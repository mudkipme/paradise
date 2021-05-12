/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [reactRefresh()],
  esbuild: {
    jsxFactory: 'jsx',
    jsxInject: "import { jsx } from '@emotion/react'",
  },
  server: {
    proxy: {
      '/graphql': 'http://127.0.0.1:4000',
      '/auth': 'http://127.0.0.1:4000',
    },
  },
});
