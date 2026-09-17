/** @type {import("prettier").Config} */
const config = {
  printWidth: 100,
  singleQuote: false,
  trailingComma: "all",
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./src/app/globals.css",
  tailwindFunctions: ["cva", "cn"],
};

export default config;
