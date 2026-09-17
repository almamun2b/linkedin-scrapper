import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-plugin-react's auto-detection reads context.getFilename(), which ESLint 10's flat-config
  // Linter no longer exposes the same way — it crashes on every run without this. Pin the version
  // instead of relying on detection.
  { settings: { react: { version: "19.2.7" } } },

  // Strict, type-checked TypeScript rules. Scoped to .ts/.tsx so the *.mjs config files (which
  // aren't part of the tsconfig project) don't need type information.
  {
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // The queue/scraper layer intentionally logs unknown/caught values as structured fields
      // (CLAUDE.md "Logging"), so this project's own `logger` calls are exempt project-wide by
      // convention rather than by inline disables.
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/no-floating-promises": "error",
      // `void paramName;` is this codebase's convention for a required-but-not-yet-used handler
      // parameter (e.g. AbortSignal in a handler with no in-page cancellation checkpoint yet) —
      // keeps the name for documentation instead of an underscore prefix. Not "meaningless".
      "@typescript-eslint/no-meaningless-void-operator": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Tailwind v4: named theme utilities only. `no-unknown-classes` rejects raw hex/arbitrary
  // color literals; `enforce-consistent-variable-syntax` rejects the v3 `[--x]` bracket form in
  // favor of v4's `(--x)` shorthand — together they are what keeps `bg-[--color-bg]`-style
  // classes (which Tailwind 4 does not resolve as `var()`) from coming back.
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "better-tailwindcss": betterTailwindcss },
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/app/globals.css",
      },
    },
    rules: {
      ...betterTailwindcss.configs["recommended"].rules,
      "better-tailwindcss/enforce-consistent-variable-syntax": "error",
      // The line-wrapping autofixer rewrites concatenated/template class strings into
      // multi-line literals and can corrupt plain double-quoted strings in the process —
      // readability nicety, not worth the risk of a fixer producing invalid syntax.
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
    },
  },

  eslintConfigPrettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
    // Vendored, third-party skill assets — not this project's source.
    ".agents/**",
    ".claude/**",
    ".opencode/**",
  ]),
]);

export default eslintConfig;
