'use dom';

import type { DOMProps } from 'expo/dom';
import { useEffect, useRef } from 'react';

import { useJellyAttrs, useJellyBind } from '@/src/components/jelly/useJellyAttrs';
import { inkOn } from '@/src/theme/tokens';

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

  useEffect(() => {
    void import('../../../vendor/jelly-ui/jelly.js');
  }, []);

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
  style.overflow = 'visible';
  style.pointerEvents = 'auto';
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
      style={
        fillHost
          ? {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box',
              overflow: 'visible',
              pointerEvents: 'none',
              background: 'transparent',
            }
          : {
              display: 'inline-flex',
              overflow: 'visible',
              pointerEvents: 'none',
              background: 'transparent',
            }
      }
    >
      <jelly-theme mode="dark" style={{ overflow: 'visible', pointerEvents: 'none' }}>
        <jelly-button
          ref={bind as never}
          style={style}
          onClick={onPress ? () => void onPress() : undefined}
        >
          {label}
        </jelly-button>
      </jelly-theme>
    </div>
  );
}
