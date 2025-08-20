import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(), 
    reactRouter(), 
    tsconfigPaths()
  ],
  define: {
    // Fix the environment variable definition
    "import.meta.env.VITE_APP_API": JSON.stringify(process.env.VITE_APP_API || ""),
  },
});