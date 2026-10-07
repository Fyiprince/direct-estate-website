import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default tseslint.config(
  { ignores: ["dist", "src/convex/_generated", ".kilo/**"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // react-hooks v7 rules that flag canonical shadcn/ui patterns
      // (initial embla scroll-state sync, skeleton shimmer widths). The
      // code is intentional; keep the rest of the react-hooks rules on.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      // Noisy on standard shadcn/ui component files (exported constants).
      "react-refresh/only-export-components": "off",
    },
  },
);
