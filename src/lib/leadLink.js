import { placeIdOf } from '../hooks/useStore';

/** Absolute URL for the lead permalink the hash router already understands. */
export function leadTabUrl(lead) {
  const pid = placeIdOf(lead);
  if (!pid || typeof window === 'undefined') return null;
  return `${window.location.origin}${window.location.pathname}${window.location.search}#/lead/${pid}`;
}

function wantsNewTab(e) {
  return !!(e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1));
}

/** A control nested inside the lead row (Call, expand) owns the click. */
function isNestedControl(e) {
  const hit = e.target?.closest?.('a, button, input, textarea, select, label');
  return !!(hit && hit !== e.currentTarget);
}

/**
 * Plain click runs `select` in this tab.
 * Command, Control, Shift, and middle-click open the lead permalink in a new
 * tab and leave this page where it is.
 *
 * The browser is not trusted with that gesture. A link whose only difference
 * from the current page is the hash (`#/lead/…` vs `#/leads`) is a same-document
 * fragment, and Chrome opens a new tab of the page you are already on. We
 * always open the absolute permalink ourselves.
 */
export function openLeadFromClick(e, lead, select) {
  if (e && isNestedControl(e)) return false;
  if (wantsNewTab(e)) {
    const url = leadTabUrl(lead);
    if (url) {
      e.preventDefault();
      e.stopPropagation();
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    return true;
  }
  if (e?.type === 'auxclick') return false;
  if (e) e.preventDefault();
  select?.(lead);
  return false;
}

export function leadClickProps(lead, select) {
  return {
    onClick: (e) => openLeadFromClick(e, lead, select),
    onAuxClick: (e) => {
      if (e.button === 1) openLeadFromClick(e, lead, select);
    },
    onMouseDown: (e) => {
      if (e.button === 1 && !isNestedControl(e)) e.preventDefault();
    },
  };
}
