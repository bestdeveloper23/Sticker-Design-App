import { createRequire } from "module";
const require = createRequire(import.meta.url);

let presets = [];
try {
  const { vercelPreset } = require("@vercel/react-router/vite");
  presets = [vercelPreset()];
} catch {
  // @vercel/react-router not installed - fine for local dev; Vercel installs it before build
}

export default {
  ssr: true,
  presets,
};
