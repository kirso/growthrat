import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const config = [
  {
    ignores: [
      ".next/**",
      ".astro/**",
      ".wrangler/**",
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "src/**/*.astro",
      "src/**/*.svelte",
      "worker-configuration.d.ts",
    ],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "no-undef": "off",
      "prefer-const": "warn",
    },
  },
];

export default config;
