import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Dimensions, PanResponder, Pressable, View, type View as RNView } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  type SharedValue,
  withSpring,
} from 'react-native-reanimated';

import { AlbumLiftOverlay, type LiftSource } from '@/src/components/ui/AlbumLiftOverlay';
import { AlbumPolaroid, POLAROID_H, POLAROID_W } from '@/src/components/ui/AlbumPolaroid';
import { MonoText } from '@/src/components/ui/MonoText';
import { msg } from '@/src/lib/messages';
import {
  canvasView,
  offscreenSpawn,
  scatterBounds,
  scatterLayout,
  type ScatterSlot,
} from '@/src/features/album/scatter-layout';
import type { PaletteColor } from '@/src/palette/types';

export type AlbumScatterItem = {
  id: string;
  photoUri: string | null;
  palette: PaletteColor[];
  capturedAt: string;
  geo: string | null;
  onOpen: () => void;
  onLongPress?: () => void;
};

type Props = {
  items: AlbumScatterItem[];
  replayKey: number;
  empty?: ReactNode;
};

const HOLD = 420;
const FOCUS_Y = 0.42;
const ZOOM_MAX = 1.175;
const ZOOM_MIN = ZOOM_MAX / 4;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function cardT(global: number, order: number) {
  'worklet';
  const start = order * 0.05;
  return Math.min(1, Math.max(0, (global - start) / 0.82));
}

function hashId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function touchDist(a: { pageX: number; pageY: number }, b: { pageX: number; pageY: number }) {
  return Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY);
}

function viewOrigin(e: { nativeEvent: { pageX: number; pageY: number; locationX: number; locationY: number } }) {
  return {
    x: e.nativeEvent.pageX - e.nativeEvent.locationX,
    y: e.nativeEvent.pageY - e.nativeEvent.locationY,
  };
}

export function AlbumScatter({ items, replayKey, empty }: Props) {
  const { width: vw, height: vh } = Dimensions.get('window');
  const slots = useMemo(() => scatterLayout(items.map((i) => i.id), replayKey), [items, replayKey]);
  const bounds = useMemo(() => scatterBounds(slots), [slots]);
  const itemMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const orderMap = useMemo(() => new Map(items.map((i, idx) => [i.id, idx])), [items]);
  const newest = items[0]?.id ?? null;
  const newestSlot = newest ? slots.find((s) => s.id === newest) : null;

  const scatter = useSharedValue(0);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const zoom = useSharedValue(ZOOM_MAX);
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(ZOOM_MAX);
  const rootRef = useRef<RNView>(null);
  const cardRefs = useRef<Map<string, RNView>>(new Map());
  const dragBase = useRef({ x: 0, y: 0 });
  const pinchDist = useRef(0);
  const pinching = useRef(false);
  const [lift, setLift] = useState<{ item: AlbumScatterItem; source: LiftSource } | null>(null);
  const liftRef = useRef(lift);
  liftRef.current = lift;
  const [spawnView, setSpawnView] = useState<ReturnType<typeof canvasView> | null>(null);

  const canvasW = bounds.maxX - bounds.minX;
  const canvasH = bounds.maxY - bounds.minY;

  const focusView = (slot: ScatterSlot, z: number) => ({
    x: vw / 2 - (slot.x - bounds.minX) * z,
    y: vh * FOCUS_Y - (slot.y - bounds.minY) * z,
  });

  const fitPan = (z: number) => ({
    x: vw / 2 - (canvasW / 2) * z,
    y: vh * FOCUS_Y - (canvasH / 2) * z,
  });

  const applyCamera = useCallback(
    (x: number, y: number, z: number) => {
      panX.value = x;
      panY.value = y;
      zoom.value = z;
      panRef.current = { x, y };
      zoomRef.current = z;
      dragBase.current = { x, y };
    },
    [panX, panY, zoom],
  );

  const replayScatter = useCallback(() => {
    setLift(null);
    scatter.value = 0;
    const startZ = ZOOM_MAX;
    const startPan = newestSlot ? focusView(newestSlot, startZ) : fitPan(startZ);
    applyCamera(startPan.x, startPan.y, startZ);
    setSpawnView(canvasView(vw, vh, startPan.x, startPan.y, startZ));
    scatter.value = withDelay(40, withSpring(1, { damping: 17, stiffness: 88, mass: 1 }));
  }, [applyCamera, newestSlot, scatter, vh, vw]);

  useEffect(() => {
    if (!items.length) return;
    replayScatter();
  }, [items.length, newest, replayKey, replayScatter]);

  const sourceFromMath = (slot: ScatterSlot): LiftSource => {
    const z = zoomRef.current;
    const p = panRef.current;
    const cx = slot.x - bounds.minX;
    const cy = slot.y - bounds.minY;
    return {
      x: p.x + (cx - POLAROID_W / 2) * z,
      y: p.y + (cy - POLAROID_H / 2) * z,
      width: POLAROID_W * z,
      height: POLAROID_H * z,
      rot: slot.rot,
    };
  };

  const beginLift = (item: AlbumScatterItem, slot: ScatterSlot) => {
    if (liftRef.current) return;
    const node = cardRefs.current.get(item.id);
    const root = rootRef.current;
    const apply = (source: LiftSource) => setLift({ item, source });
    const fallback = () => apply(sourceFromMath(slot));

    if (node && root) {
      const math = sourceFromMath(slot);
      node.measureInWindow((x, y, w, h) => {
        root.measureInWindow((rx, ry) => {
          if (w > 8 && h > 8) {
            apply({
              x: x - rx + w / 2 - math.width / 2,
              y: y - ry + h / 2 - math.height / 2,
              width: math.width,
              height: math.height,
              rot: slot.rot,
            });
          } else fallback();
        });
      });
      return;
    }
    fallback();
  };

  const applyPinch = (
    ox: number,
    oy: number,
    a: { pageX: number; pageY: number },
    b: { pageX: number; pageY: number },
  ) => {
    const dist = touchDist(a, b);
    if (dist < 8 || pinchDist.current < 8) {
      pinchDist.current = Math.max(dist, pinchDist.current);
      return;
    }
    const focalX = (a.pageX + b.pageX) / 2 - ox;
    const focalY = (a.pageY + b.pageY) / 2 - oy;
    const z = zoomRef.current;
    const p = panRef.current;
    const worldX = (focalX - p.x) / z;
    const worldY = (focalY - p.y) / z;
    const nextZ = clamp(z * (dist / pinchDist.current), ZOOM_MIN, ZOOM_MAX);
    const nextPan = { x: focalX - worldX * nextZ, y: focalY - worldY * nextZ };
    pinchDist.current = dist;
    zoom.value = nextZ;
    panX.value = nextPan.x;
    panY.value = nextPan.y;
    zoomRef.current = nextZ;
    panRef.current = nextPan;
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (e) => !liftRef.current && e.nativeEvent.touches.length >= 2,
        onMoveShouldSetPanResponder: (e, g) =>
          !liftRef.current && (e.nativeEvent.touches.length >= 2 || Math.hypot(g.dx, g.dy) > 10),
        onStartShouldSetPanResponderCapture: (e) => !liftRef.current && e.nativeEvent.touches.length >= 2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          pinching.current = e.nativeEvent.touches.length >= 2;
          pinchDist.current = 0;
          dragBase.current = panRef.current;
          const touches = e.nativeEvent.touches;
          if (touches.length >= 2) pinchDist.current = touchDist(touches[0], touches[1]);
        },
        onPanResponderMove: (e, g) => {
          const origin = viewOrigin(e);
          const touches = e.nativeEvent.touches;
          if (touches.length >= 2) {
            if (!pinching.current) {
              pinching.current = true;
              pinchDist.current = touchDist(touches[0], touches[1]);
            }
            applyPinch(origin.x, origin.y, touches[0], touches[1]);
            return;
          }
          if (pinching.current) {
            pinching.current = false;
            dragBase.current = panRef.current;
          }
          const next = { x: dragBase.current.x + g.dx, y: dragBase.current.y + g.dy };
          panX.value = next.x;
          panY.value = next.y;
          panRef.current = next;
        },
        onPanResponderRelease: () => {
          pinching.current = false;
          pinchDist.current = 0;
        },
        onPanResponderTerminate: () => {
          pinching.current = false;
          pinchDist.current = 0;
        },
      }),
    [panX, panY, zoom],
  );

  const canvasStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }, { translateY: panY.value }],
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: zoom.value }],
  }));

  if (!items.length) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 48,
          paddingHorizontal: 16,
          width: '100%',
        }}
      >
        {empty ?? <MonoText dim>{msg.noSavedTakes}</MonoText>}
      </View>
    );
  }

  const view = spawnView ?? canvasView(vw, vh, panRef.current.x, panRef.current.y, zoomRef.current);

  return (
    <View ref={rootRef} style={{ flex: 1, overflow: 'hidden' }} {...responder.panHandlers}>
      <Animated.View
        style={[{ position: 'absolute', left: 0, top: 0, width: canvasW, height: canvasH }, canvasStyle]}
      >
        <Animated.View style={[{ width: canvasW, height: canvasH, transformOrigin: 'top left' }, scaleStyle]}>
          {slots.map((slot, z) => {
            const item = itemMap.get(slot.id);
            if (!item) return null;
            const order = orderMap.get(slot.id) ?? z;
            const endCx = slot.x - bounds.minX;
            const endCy = slot.y - bounds.minY;
            const seed = hashId(`${slot.id}:${replayKey}`);
            const spawn = offscreenSpawn(endCx, endCy, seed, view);
            return (
              <ScatterCard
                key={`${slot.id}-${replayKey}`}
                scatter={scatter}
                order={order}
                startLeft={spawn.x - POLAROID_W / 2}
                startTop={spawn.y - POLAROID_H / 2}
                endLeft={endCx - POLAROID_W / 2}
                endTop={endCy - POLAROID_H / 2}
                startRot={(slot.rot > 0 ? 1 : -1) * (36 + (seed % 18))}
                rot={slot.rot}
                zIndex={items.length - order}
                hidden={lift?.item.id === slot.id}
                onRef={(node) => {
                  if (node) cardRefs.current.set(slot.id, node);
                  else cardRefs.current.delete(slot.id);
                }}
                onPress={() => beginLift(item, slot)}
                onLongPress={item.onLongPress}
              >
                <AlbumPolaroid photoUri={item.photoUri} palette={item.palette} />
              </ScatterCard>
            );
          })}
        </Animated.View>
      </Animated.View>

      {lift ? (
        <AlbumLiftOverlay
          source={lift.source}
          photoUri={lift.item.photoUri}
          palette={lift.item.palette}
          capturedAt={lift.item.capturedAt}
          geo={lift.item.geo}
          onClose={() => setLift(null)}
          onOpen={lift.item.onOpen}
        />
      ) : null}
    </View>
  );
}

function ScatterCard({
  scatter,
  order,
  startLeft,
  startTop,
  endLeft,
  endTop,
  startRot,
  rot,
  zIndex,
  hidden,
  onRef,
  onPress,
  onLongPress,
  children,
}: {
  scatter: SharedValue<number>;
  order: number;
  startLeft: number;
  startTop: number;
  endLeft: number;
  endTop: number;
  startRot: number;
  rot: number;
  zIndex: number;
  hidden: boolean;
  onRef: (node: RNView | null) => void;
  onPress: () => void;
  onLongPress?: () => void;
  children: ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const t = cardT(scatter.value, order);
    const ease = t * t * (3 - 2 * t);
    return {
      position: 'absolute',
      left: startLeft + (endLeft - startLeft) * ease,
      top: startTop + (endTop - startTop) * ease,
      opacity: hidden ? 0 : 0.2 + ease * 0.8,
      transform: [{ rotate: `${startRot + (rot - startRot) * ease}deg` }],
      zIndex,
    };
  });

  return (
    <Animated.View ref={onRef} style={style} collapsable={false}>
      <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={HOLD}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
