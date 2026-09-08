'use dom';

import type { DOMProps } from 'expo/dom';
import { useRef } from 'react';

import { useJellyAttrs, useJellyBind } from '@/src/components/jelly/useJellyAttrs';
import { inkOn } from '@/src/theme/tokens';

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
  fillHost?: boolean;
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
  fillHost,
  onPress,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const tone = fill ? variant : active ? 'mint' : variant;

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

  const style: Record<string, string | number> = {};
  if (fill) {
    const label = inkOn(fill);
    style['--jelly-fill'] = fill;
    style['--jelly-label'] = label;
    style['--jelly-color-foreground-on-accent'] = label;
  }
  if (minWidth) style['--jelly-button-min-width'] = `${minWidth}px`;
  if (height) style['--jelly-button-height'] = `${height}px`;

  return (
    <div
      onPointerUp={onPress ? () => void onPress() : undefined}
      style={
        fillHost
          ? {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              background: 'transparent',
            }
          : { display: 'inline-flex', background: 'transparent' }
      }
    >
      <jelly-theme mode="dark">
        <jelly-button ref={bind as never} style={style}>
          {label}
        </jelly-button>
      </jelly-theme>
    </div>
  );
}
