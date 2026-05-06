import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  {
    ignores: [
      ".next/**",
      ".astro/**",
      ".wrangler/**",
      "dist/**",
      "node_modules/**",
      "convex/_generated/**",
      "coverage/**",
      "src/**/*.astro",
      "src/**/*.svelte",
      "worker-configuration.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "prefer-const": "warn",
      "import/no-anonymous-default-export": "off",
    },
  },
];

export default config;
