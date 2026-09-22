// Feature flags for hiding WIP work on a given deploy — see .env.example.
//
// Next.js only inlines `NEXT_PUBLIC_*` vars into the client bundle for
// statically-analyzable literal access (`process.env.NEXT_PUBLIC_X`) — a
// dynamic/templated lookup like `process.env[`NEXT_PUBLIC_${name}`]` is
// NOT substituted and reads as `undefined` in the browser. So each flag
// needs its own literal export below rather than a generic
// `isFeatureEnabled(name)` helper.
//
// To add a flag: add a line here, add the var to .env.example, and gate
// the relevant component with it.
//
// export const FEATURE_X = process.env.NEXT_PUBLIC_FEATURE_X === "true";
