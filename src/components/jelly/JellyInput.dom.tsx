'use dom';

import type { DOMProps } from 'expo/dom';
import { useEffect, useRef } from 'react';

import { useJellyAttrs, useJellyBind } from '@/src/components/jelly/useJellyAttrs';

type Props = {
  dom?: DOMProps;
  value: string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => Promise<void>;
};

export default function JellyInputDom({
  value,
  placeholder,
  label,
  disabled,
  onValueChange,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    void import('../../../vendor/jelly-ui/jelly.js');
  }, []);

  useJellyAttrs(ref, {
    size: 'sm',
    value,
    placeholder,
    label,
    disabled: disabled ?? undefined,
  });

  const bind = useJellyBind(ref, {
    size: 'sm',
    value,
    placeholder,
    label,
    disabled: disabled ?? undefined,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onChange = () => {
      const input = el.shadowRoot?.querySelector('input');
      if (input && onValueChange) void onValueChange(input.value);
    };
    el.addEventListener('change', onChange);
    el.addEventListener('input', onChange);
    return () => {
      el.removeEventListener('change', onChange);
      el.removeEventListener('input', onChange);
    };
  }, [onValueChange]);

  return (
    <div style={{ display: 'block', width: '100%', background: 'transparent' }}>
      <jelly-theme mode="dark">
        <jelly-input ref={bind as never} style={{ width: '100%', display: 'block' }} />
      </jelly-theme>
    </div>
  );
}
