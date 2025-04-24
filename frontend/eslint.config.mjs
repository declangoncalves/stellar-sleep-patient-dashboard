// frontend/eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import prettierPlugin from "eslint-plugin-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const compat     = new FlatCompat({ baseDirectory: __dirname });

export default [
  // existing Next.js + TS rules
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "prettier"                 // ← disables ESLint rules that clash
  ),

  // enable the plugin’s “prettier/prettier” rule
  {
    plugins: { "prettier": prettierPlugin },
    rules: {
      "prettier/prettier": "error"
    }
  }
];
