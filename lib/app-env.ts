// Which environment the app is running in.
//
// On Vercel, NEXT_PUBLIC_VERCEL_ENV is "production", "preview" or "development"
// (Vercel exposes system environment variables to Next.js automatically).
// Locally, `pnpm dev` is treated as "development" and a local production build
// as "production", so dev tools never appear on the live site by accident.

export type AppEnv = "production" | "preview" | "development"

function resolveAppEnv(): AppEnv {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
  if (vercelEnv === "production" || vercelEnv === "preview" || vercelEnv === "development") {
    return vercelEnv
  }
  return process.env.NODE_ENV === "development" ? "development" : "production"
}

export const APP_ENV: AppEnv = resolveAppEnv()
export const IS_PRODUCTION = APP_ENV === "production"

/** Git branch and short commit of this build, when built on Vercel. */
export const BUILD_BRANCH = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ?? null
export const BUILD_COMMIT = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null

/** Production site, used by previews to fetch puzzles their branch doesn't have yet. */
export const PRODUCTION_ORIGIN = "https://www.tridokupuzzle.com"

/** localStorage key holding the dev clock offset in milliseconds (non-production only). */
export const DEV_TIME_OFFSET_KEY = "tridoku-dev-time-offset"

/**
 * Runs before the app boots (see app/layout.tsx). If a dev clock offset is set,
 * it shifts `new Date()` and `Date.now()` so the whole app believes it is that time.
 * Only ever rendered outside production.
 */
export const DEV_CLOCK_SCRIPT = `(function(){try{
  var o = Number(localStorage.getItem(${JSON.stringify(DEV_TIME_OFFSET_KEY)})) || 0;
  if (!o) return;
  var RealDate = Date;
  function ShiftedDate() {
    var args = Array.prototype.slice.call(arguments);
    if (!(this instanceof ShiftedDate)) return new RealDate(RealDate.now() + o).toString();
    if (args.length === 0) return new RealDate(RealDate.now() + o);
    return new (Function.prototype.bind.apply(RealDate, [null].concat(args)))();
  }
  ShiftedDate.prototype = RealDate.prototype;
  ShiftedDate.now = function(){ return RealDate.now() + o; };
  ShiftedDate.UTC = RealDate.UTC;
  ShiftedDate.parse = RealDate.parse;
  window.Date = ShiftedDate;
  window.__tridokuRealDate = RealDate;
}catch(e){}})();`
