import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';

type JellyAttrs = Record<string, string | boolean | undefined | null>;

/** React property names can clobber jelly-ui instance methods (e.g. shape()). */
export function applyJellyAttrs(el: HTMLElement | null, attrs: JellyAttrs) {
  if (!el) return;
  for (const [key, val] of Object.entries(attrs)) {
    if (val === undefined || val === null || val === false) {
      el.removeAttribute(key);
    } else if (val === true) {
      el.setAttribute(key, '');
    } else {
      el.setAttribute(key, val);
    }
  }
}

export function useJellyAttrs(ref: RefObject<HTMLElement | null>, attrs: JellyAttrs) {
  useLayoutEffect(() => {
    applyJellyAttrs(ref.current, attrs);
  }, [ref, attrs]);
}

/** Stable ref callback — never inline in JSX or DomWebView remounts. */
export function useJellyBind(ref: RefObject<HTMLElement | null>, attrs: JellyAttrs) {
  const attrsRef = useRef(attrs);
  attrsRef.current = attrs;

  return useCallback((el: HTMLElement | null) => {
    ref.current = el;
    applyJellyAttrs(el, attrsRef.current);
  }, [ref]);
}
