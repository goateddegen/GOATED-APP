// =============================================================================
// GOATED — Phone display formatting
// -----------------------------------------------------------------------------
// Places returns E.164 (`+13462391620`). That is the right thing to store and
// the right thing to put in a tel: link, but it is hard to read off a screen
// while you are dialling — which is most of what this app is for.
//
// Mirrors formatPhone in src/hooks/useStore.js. Duplicated rather than shared
// because api/ and src/ are separate bundles; keep the two in step.
//
// This module is NOT a serverless function (underscore-prefixed directory).
// =============================================================================

/** `+13462391620` -> `(346) 239-1620`. Non-NANP numbers are returned unchanged. */
export function formatPhone(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  const digits = s.replace(/\D/g, '');
  const ext = s.match(/(?:ext|x|#)\.?\s*(\d{1,6})\s*$/i);
  const core = ext ? digits.slice(0, digits.length - ext[1].length) : digits;
  const tail = ext ? ` ext. ${ext[1]}` : '';

  if (core.length === 10) {
    return `(${core.slice(0, 3)}) ${core.slice(3, 6)}-${core.slice(6)}${tail}`;
  }
  if (core.length === 11 && core[0] === '1') {
    return `(${core.slice(1, 4)}) ${core.slice(4, 7)}-${core.slice(7)}${tail}`;
  }
  return s;
}
