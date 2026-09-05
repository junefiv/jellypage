'use dom';

import type { DOMProps } from 'expo/dom';
import { useEffect, useRef } from 'react';

import { useJellyAttrs, useJellyBind } from '@/src/components/jelly/useJellyAttrs';

import '../../../vendor/jelly-ui/jelly.js';

type Variant = 'white' | 'rose' | 'amber' | 'azure' | 'mint' | 'platinum' | 'graphite';

type Props = {
  dom?: DOMProps;
  label: string;
  variant?: Variant;
  active?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  shape?: 'square';
  fill?: string;
  minWidth?: number;
  height?: number;
  onPress?: () => Promise<void>;
};

export default function JellyButtonDom({
  label,
  variant = 'platinum',
  active,
  disabled,
  size = 'sm',
  shape,
  fill,
  minWidth,
  height,
  onPress,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const tone = active ? 'mint' : variant;

  useJellyAttrs(ref, {
    size,
    variant: tone,
    shape,
    label,
    disabled: disabled ?? undefined,
  });

  const bind = useJellyBind(ref, {
    size,
    variant: tone,
    shape,
    label,
    disabled: disabled ?? undefined,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !onPress) return;
    const run = () => {
      void onPress();
    };
    el.addEventListener('click', run);
    return () => el.removeEventListener('click', run);
  }, [onPress]);

  const style: Record<string, string | number> = {};
  if (fill) style['--jelly-fill'] = fill;
  if (minWidth) style['--jelly-button-min-width'] = `${minWidth}px`;
  if (height) style['--jelly-button-height'] = `${height}px`;

  return (
    <div style={{ display: 'inline-flex', background: 'transparent' }}>
      <jelly-theme mode="dark">
        <jelly-button ref={bind as never} style={style}>
          {label}
        </jelly-button>
      </jelly-theme>
    </div>
  );
}
