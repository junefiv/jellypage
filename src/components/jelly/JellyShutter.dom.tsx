'use dom';

import type { DOMProps } from 'expo/dom';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { useJellyAttrs, useJellyBind } from '@/src/components/jelly/useJellyAttrs';
import { SHUTTER_FACE, SHUTTER_FRAME } from '@/src/components/ui/shutterConstants';

type Props = {
  dom?: DOMProps;
  tone: string;
  busy?: boolean;
  onPress?: () => Promise<void>;
};

/** Max round square — soft hex blob; must stay unmasked so jelly wobble shows. */
const RADIUS = (SHUTTER_FACE - 6) * 0.48;

function ShutterEyes() {
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);
  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);
  const leftLidRef = useRef<HTMLDivElement>(null);
  const rightLidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    let alive = true;
    const start = performance.now();
    let leftPupil = { x: 0, y: 0 };
    let rightPupil = { x: 0, y: 0 };
    let leftEye = { x: 0, y: 0 };
    let rightEye = { x: 0, y: 0 };
    let goalLeftPupil = { x: 0, y: 0 };
    let goalRightPupil = { x: 0, y: 0 };
    let goalLeftEye = { x: 0, y: 0 };
    let goalRightEye = { x: 0, y: 0 };
    let nextPupilGoal = 0;
    let nextEyeGoal = 0;

    const drift = (maxX: number, maxY: number) => ({
      x: (Math.random() - 0.5) * 2 * maxX,
      y: (Math.random() - 0.5) * 2 * maxY,
    });

    const tick = (now: number) => {
      if (!alive) return;
      const t = now - start;

      if (now >= nextPupilGoal) {
        goalLeftPupil = drift(3.8, 2.4);
        goalRightPupil = {
          x: goalLeftPupil.x * 0.82 + (Math.random() - 0.5) * 1.6,
          y: goalLeftPupil.y * 0.82 + (Math.random() - 0.5) * 1.2,
        };
        nextPupilGoal = now + 700 + Math.random() * 1100;
      }

      if (now >= nextEyeGoal) {
        const shared = drift(5.5, 3.6);
        goalLeftEye = {
          x: shared.x + (Math.random() - 0.5) * 2.2,
          y: shared.y + (Math.random() - 0.5) * 1.6,
        };
        goalRightEye = {
          x: shared.x * 0.9 + (Math.random() - 0.5) * 2.2,
          y: shared.y * 0.9 + (Math.random() - 0.5) * 1.6,
        };
        nextEyeGoal = now + 1400 + Math.random() * 1800;
      }

      const wobbleX = Math.sin(t * 0.0014) * 1.4 + Math.sin(t * 0.0031) * 0.7;
      const wobbleY = Math.cos(t * 0.0012) * 1.1 + Math.sin(t * 0.0024) * 0.5;
      const eyeWobbleX = Math.sin(t * 0.0009) * 2.2 + Math.sin(t * 0.0017) * 1.1;
      const eyeWobbleY = Math.cos(t * 0.0008) * 1.8 + Math.sin(t * 0.0015) * 0.9;

      leftPupil = {
        x: leftPupil.x + (goalLeftPupil.x + wobbleX - leftPupil.x) * 0.07,
        y: leftPupil.y + (goalLeftPupil.y + wobbleY - leftPupil.y) * 0.07,
      };
      rightPupil = {
        x: rightPupil.x + (goalRightPupil.x + wobbleX - rightPupil.x) * 0.07,
        y: rightPupil.y + (goalRightPupil.y + wobbleY - rightPupil.y) * 0.07,
      };
      leftEye = {
        x: leftEye.x + (goalLeftEye.x + eyeWobbleX - leftEye.x) * 0.045,
        y: leftEye.y + (goalLeftEye.y + eyeWobbleY - leftEye.y) * 0.045,
      };
      rightEye = {
        x: rightEye.x + (goalRightEye.x + eyeWobbleX - rightEye.x) * 0.045,
        y: rightEye.y + (goalRightEye.y + eyeWobbleY - rightEye.y) * 0.045,
      };

      const lp = leftPupilRef.current;
      const rp = rightPupilRef.current;
      const le = leftEyeRef.current;
      const re = rightEyeRef.current;
      if (lp) lp.style.transform = `translate(${leftPupil.x}px, ${leftPupil.y}px)`;
      if (rp) rp.style.transform = `translate(${rightPupil.x}px, ${rightPupil.y}px)`;
      if (le) le.style.transform = `translate(${leftEye.x}px, ${leftEye.y}px)`;
      if (re) re.style.transform = `translate(${rightEye.x}px, ${rightEye.y}px)`;

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let alive = true;

    const blink = () => {
      if (!alive) return;
      const lids = [leftLidRef.current, rightLidRef.current];
      for (const lid of lids) {
        if (!lid) continue;
        lid.style.transform = 'scaleY(0.1)';
        timers.push(
          window.setTimeout(() => {
            if (lid) lid.style.transform = 'scaleY(1)';
          }, 100),
        );
      }
      timers.push(window.setTimeout(blink, 2200 + Math.random() * 3200));
    };

    timers.push(window.setTimeout(blink, 1400 + Math.random() * 800));
    return () => {
      alive = false;
      for (const t of timers) clearTimeout(t);
    };
  }, []);

  return (
    <div className="shutter-eyes" aria-hidden="true">
      <div ref={leftEyeRef} className="shutter-eye">
        <div ref={leftLidRef} className="shutter-lid">
          <div ref={leftPupilRef} className="shutter-pupil" />
        </div>
      </div>
      <div ref={rightEyeRef} className="shutter-eye shutter-eye-r">
        <div ref={rightLidRef} className="shutter-lid">
          <div ref={rightPupilRef} className="shutter-pupil" />
        </div>
      </div>
    </div>
  );
}

export default function JellyShutterDom({ tone, busy, onPress }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    // The custom element extends HTMLElement, so load it only in the browser.
    void import('../../../vendor/jelly-ui/jelly.js');
  }, []);

  const attrs = useMemo(
    () => ({
      size: 'large',
      shape: 'square',
      label: 'TAKE',
      disabled: busy ?? undefined,
    }),
    [busy],
  );

  useJellyAttrs(ref, attrs);
  const bind = useJellyBind(ref, attrs);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--jelly-fill', tone);
    el.style.setProperty('--jelly-icon-button-size', `${SHUTTER_FACE}px`);
    el.style.setProperty('--jelly-icon-button-radius', `${RADIUS}px`);
  }, [tone]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onPress) return;
    const run = () => {
      void onPress();
    };
    el.addEventListener('click', run);
    return () => el.removeEventListener('click', run);
  }, [onPress]);

  return (
    <>
      <style>{`
        .shutter-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${SHUTTER_FRAME}px;
          height: ${SHUTTER_FRAME}px;
          overflow: visible;
          background: transparent;
        }
        .shutter-eyes {
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          user-select: none;
        }
        .shutter-eye {
          width: 24px;
          height: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          will-change: transform;
        }
        .shutter-eye-r {
          margin-left: -5px;
        }
        .shutter-lid {
          width: 24px;
          height: 15px;
          border-radius: 999px;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: center center;
          transition: transform 0.08s ease-out;
          box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.06);
        }
        .shutter-pupil {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #111;
          will-change: transform;
        }
      `}</style>
      <div className="shutter-wrap">
        <jelly-theme mode="dark">
          <jelly-icon-button ref={bind as never}>
            <ShutterEyes />
          </jelly-icon-button>
        </jelly-theme>
      </div>
    </>
  );
}
