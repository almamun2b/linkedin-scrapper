import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-plugin-react's auto-detection reads context.getFilename(), which ESLint 10's flat-config
  // Linter no longer exposes the same way — it crashes on every run without this. Pin the version
  // instead of relying on detection.
  { settings: { react: { version: "19.2.7" } } },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
