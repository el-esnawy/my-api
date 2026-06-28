// Ambient declarations for global CSS side-effect imports, e.g.
//   import "./globals.css";
//
// Next.js bundles these via PostCSS/Tailwind at build time; this file only
// satisfies the TypeScript language server (some editors report TS2882
// "Cannot find module or type declarations for side-effect import" without it).
// `*.module.css` keeps any more specific typed declaration, since it is a
// closer pattern match than `*.css`.
declare module "*.css";
declare module "*.scss";
declare module "*.sass";
