'use dom';

import type { DOMProps } from 'expo/dom';
import { useEffect, useMemo, useRef } from 'react';

import { useJellyAttrs, useJellyBind } from '@/src/components/jelly/useJellyAttrs';
import { inkOn } from '@/src/theme/tokens';

type Props = {
  dom?: DOMProps;
  width: number;
  height: number;
  gap: number;
  bleed: number;
  leftLabel: string;
  rightLabel: string;
  leftTone: string;
  rightTone: string;
  busy?: boolean;
  onLeft: () => Promise<void>;
  onRight: () => Promise<void>;
};

export default function JellyActionPairDom({
  width,
  height,
  gap,
  bleed,
  leftLabel,
  rightLabel,
  leftTone,
  rightTone,
  busy,
  onLeft,
  onRight,
}: Props) {
  const leftRef = useRef<HTMLElement>(null);
  const rightRef = useRef<HTMLElement>(null);
  const buttonWidth = Math.max(88, Math.floor((width - gap) / 2) - 64);
  const buttonHeight = Math.max(48, height - 72);
  const leftAttrs = useMemo(
    () => ({ size: 'md', label: leftLabel, disabled: busy ?? undefined }),
    [busy, leftLabel],
  );
  const rightAttrs = useMemo(
    () => ({ size: 'md', label: busy ? '…' : rightLabel, disabled: busy ?? undefined }),
    [busy, rightLabel],
  );

  useEffect(() => {
    void import('../../../vendor/jelly-ui/jelly.js');
  }, []);

  useJellyAttrs(leftRef, leftAttrs);
  useJellyAttrs(rightRef, rightAttrs);
  const bindLeft = useJellyBind(leftRef, leftAttrs);
  const bindRight = useJellyBind(rightRef, rightAttrs);

  return (
    <>
      <style>{`
        .action-frame {
          width: ${width + bleed}px;
          height: ${height + bleed}px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
          pointer-events: none;
          background: transparent;
        }
        .action-row {
          width: ${width}px;
          height: ${height}px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: ${gap}px;
          overflow: visible;
          pointer-events: none;
        }
        jelly-theme {
          pointer-events: none;
        }
        jelly-button {
          --jelly-button-min-width: ${buttonWidth}px;
          --jelly-button-height: ${buttonHeight}px;
          pointer-events: auto;
        }
      `}</style>
      <div className="action-frame">
        <div className="action-row">
          <jelly-theme mode="dark">
            <jelly-button
              ref={bindLeft as never}
              style={{
                '--jelly-fill': leftTone,
                '--jelly-label': inkOn(leftTone),
                '--jelly-color-foreground-on-accent': inkOn(leftTone),
              }}
              onClick={() => void onLeft()}
            >
              {leftLabel}
            </jelly-button>
          </jelly-theme>
          <jelly-theme mode="dark">
            <jelly-button
              ref={bindRight as never}
              style={{
                '--jelly-fill': rightTone,
                '--jelly-label': inkOn(rightTone),
                '--jelly-color-foreground-on-accent': inkOn(rightTone),
              }}
              onClick={() => void onRight()}
            >
              {busy ? '…' : rightLabel}
            </jelly-button>
          </jelly-theme>
        </div>
      </div>
    </>
  );
}
