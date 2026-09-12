'use dom';

import type { DOMProps } from 'expo/dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from 'react';

import { whenJellyAlertBuilt } from '@/src/components/jelly/loadJelly.dom';
import { applyJellyAttrs } from '@/src/components/jelly/useJellyAttrs';
import { ALERT_BLEED } from '@/src/components/ui/alertConstants';

type Size = 'small' | 'medium' | 'large';
type Tone = 'info' | 'success' | 'warning' | 'danger';

type Props = {
  dom?: DOMProps;
  message: string;
  tone?: Tone;
  size?: Size;
  accent?: string;
  accentFill?: string;
  accentBorder?: string;
  accentIcon?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  dismissRef?: MutableRefObject<(() => void) | null>;
};

function paintAccent(
  el: HTMLElement,
  accent?: string,
  accentIcon?: string,
  accentFill?: string,
  accentBorder?: string,
) {
  if (accentIcon ?? accent) el.style.setProperty('--tone', accentIcon ?? accent!);
  if (accentFill) el.style.setProperty('--jelly-fill', accentFill);
  if (accentBorder) el.style.setProperty('--jelly-alert-border', accentBorder);
}

export default function JellyAlertDom({
  message,
  tone = 'info',
  size = 'medium',
  accent,
  accentFill,
  accentBorder,
  accentIcon,
  dismissible,
  onDismiss,
  dismissRef,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const attrsRef = useRef({ tone, size, dismissible: dismissible ?? undefined });
  attrsRef.current = { tone, size, dismissible: dismissible ?? undefined };
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  const bind = useCallback((el: HTMLElement | null) => {
    ref.current = el;
    applyJellyAttrs(el, attrsRef.current);
    setNode(el);
  }, []);

  useLayoutEffect(() => {
    applyJellyAttrs(node, attrsRef.current);
  }, [node, tone, size, dismissible]);

  useLayoutEffect(() => {
    if (!node || !ready) return;
    paintAccent(node, accent, accentIcon, accentFill, accentBorder);
  }, [node, ready, accent, accentIcon, accentFill, accentBorder]);

  useEffect(() => {
    if (!node) return;
    let alive = true;
    setReady(false);
    void whenJellyAlertBuilt(node).then(() => {
      if (!alive) return;
      paintAccent(node, accent, accentIcon, accentFill, accentBorder);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [node, message, accent, accentIcon, accentFill, accentBorder]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const run = () => onDismiss?.();
    el.addEventListener('dismiss', run);

    if (dismissRef) {
      dismissRef.current = () => {
        const alert = el as HTMLElement & { dismiss?: () => void };
        if (typeof alert.dismiss === 'function') alert.dismiss();
        else run();
      };
    }

    return () => {
      el.removeEventListener('dismiss', run);
      if (dismissRef) dismissRef.current = null;
    };
  }, [node, onDismiss, dismissRef]);

  return (
    <>
      <style>{`
        .jelly-alert-host {
          display: flex;
          align-items: center;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          padding-block: ${ALERT_BLEED}px;
          overflow: visible;
          background: transparent;
        }
        .jelly-alert-host[data-ready='false'] {
          opacity: 0;
        }
        .jelly-alert-host jelly-theme,
        .jelly-alert-host jelly-alert {
          display: block;
          width: 100%;
          overflow: visible;
        }
        jelly-alert:not(:defined) {
          visibility: hidden;
        }
      `}</style>
      <div className="jelly-alert-host" data-ready={ready ? 'true' : 'false'}>
        <jelly-theme mode="dark">
          <jelly-alert ref={bind as never}>
            {ready ? message : ''}
          </jelly-alert>
        </jelly-theme>
      </div>
    </>
  );
}
