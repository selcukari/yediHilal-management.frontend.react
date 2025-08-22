import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  define: {
    "process.env": {
    "import.meta.env.VITE_APP_API": JSON.stringify(process.env.VITE_APP_API),
    "import.meta.env.VITE_APP_API_BASE_CONTROLLER": JSON.stringify(process.env.VITE_APP_API_BASE_CONTROLLER),
    "import.meta.env.VITE_APP_API_USER_CONTROLLER": JSON.stringify(process.env.VITE_APP_API_USER_CONTROLLER),
    }
  },
});