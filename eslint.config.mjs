import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Uploaded media is served from /media at runtime, so plain <img> is intentional.
      "@next/next/no-img-element": "off",
    },
  },
  {
    // react-three-fiber mutates three.js objects and uniforms inside useFrame by design.
    files: ["src/components/three/**"],
    rules: { "react-hooks/immutability": "off", "react-hooks/purity": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "storage/**",
  ]),
]);

export default eslintConfig;
