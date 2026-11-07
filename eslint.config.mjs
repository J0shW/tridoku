import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts", "docs/**"],
  },
  {
    // CommonJS scripts (Playwright helpers) use require().
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Existing code that predates the React Compiler rules. Kept as warnings until
    // it is restructured: the game hook in TRI-080, vendored shadcn components as needed.
    files: ["hooks/use-tridoku.ts", "components/ui/**"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/immutability": "warn",
    },
  },
]

export default config
