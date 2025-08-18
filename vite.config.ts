import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  define: {
    "process.env": {
    "import.meta.env.VITE_APP_API": JSON.stringify(process.env.VITE_APP_API),
    }
  },
  server: {
    proxy: {
      '/.well-known': {
        target: 'http://localhost', // or any dummy endpoint
        rewrite: (path) => '', // ignore the request
      },
    },
  },
});
