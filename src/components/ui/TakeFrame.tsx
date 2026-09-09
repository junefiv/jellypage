import { Image } from 'expo-image';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, View } from 'react-native';

import { MonoText } from '@/src/components/ui/MonoText';
import { PaletteRow } from '@/src/components/ui/PaletteRow';
import { formatDate } from '@/src/lib/format';
import { sampleAt, warmSample } from '@/src/palette/sampleAt';
import type { PaletteColor } from '@/src/palette/types';
import { colors } from '@/src/theme/tokens';

const FRAME = 62 / 86;
const EDGE = `${(6 / 62) * 100}%`;
const MARK = 12;
const HIT = 18;

type Props = {
  photoUri: string | null;
  capturedAt: string;
  geo: string | null;
  palette: PaletteColor[];
  clock?: string | null;
  onPhotoPress?: () => void;
  onPaletteChange?: (palette: PaletteColor[]) => void;
  onDragChange?: (dragging: boolean) => void;
  footer?: ReactNode;
};

export function TakeFrame({
  photoUri,
  capturedAt,
  geo,
  palette,
  clock,
  onPhotoPress,
  onPaletteChange,
  onDragChange,
  footer,
}: Props) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [img, setImg] = useState({ w: 0, h: 0 });
  const fill = { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 };

  useEffect(() => {
    if (photoUri && onPaletteChange) warmSample(photoUri);
  }, [photoUri, onPaletteChange]);

  const photo = photoUri ? (
    <Image
      source={{ uri: photoUri }}
      style={fill}
      contentFit="cover"
      onLoad={(e) => {
        const w = e.source?.width ?? 0;
        const h = e.source?.height ?? 0;
        if (w && h) setImg({ w, h });
      }}
    />
  ) : (
    <View style={[fill, { backgroundColor: colors.line }]} />
  );

  return (
    <View style={{ paddingHorizontal: 28 }}>
      <View
        style={{
          width: '100%',
          aspectRatio: FRAME,
          backgroundColor: colors.paper,
          borderWidth: 1,
          borderColor: colors.paperEdge,
          shadowColor: '#000',
          shadowOpacity: 0.55,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 10,
            backgroundColor: 'rgba(0,0,0,0.06)',
          }}
        />
        <View
          style={{
            flex: 1,
            paddingHorizontal: EDGE,
            paddingTop: 10,
            paddingBottom: 12,
          }}
        >
          <View style={{ marginBottom: 10 }}>
            <MonoText size={11} style={{ color: colors.ink }} numberOfLines={1}>
              {formatDate(capturedAt)}
              {clock ? `  ${clock}` : ''}
              {'  '}
              {geo ?? '—'}
            </MonoText>
          </View>
          <View
            style={{
              flex: 1,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.12)',
            }}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setBox({ w: width, h: height });
            }}
          >
            {onPhotoPress ? (
              <Pressable onPress={onPhotoPress} style={{ flex: 1 }}>
                {photo}
              </Pressable>
            ) : (
              photo
            )}
            <OriginMarks
              uri={photoUri}
              palette={palette}
              box={box}
              img={img}
              editable={Boolean(photoUri && onPaletteChange)}
              onPaletteChange={onPaletteChange}
              onDragChange={onDragChange}
            />
          </View>
          <View style={{ marginTop: 5 }}>
            <PaletteRow colors={palette} height={40} ink={colors.ink} />
            {footer}
          </View>
        </View>
      </View>
    </View>
  );
}

function OriginMarks({
  uri,
  palette,
  box,
  img,
  editable,
  onPaletteChange,
  onDragChange,
}: {
  uri: string | null;
  palette: PaletteColor[];
  box: { w: number; h: number };
  img: { w: number; h: number };
  editable: boolean;
  onPaletteChange?: (palette: PaletteColor[]) => void;
  onDragChange?: (dragging: boolean) => void;
}) {
  const paletteRef = useRef(palette);
  paletteRef.current = palette;
  const mapRef = useRef(coverMap(box, img));
  mapRef.current = coverMap(box, img);
  const drag = useRef<{ index: number; x0: number; y0: number } | null>(null);
  const tick = useRef(0);
  const [hold, setHold] = useState<{ index: number; left: number; top: number } | null>(null);

  const uriRef = useRef(uri);
  uriRef.current = uri;
  const changeRef = useRef(onPaletteChange);
  changeRef.current = onPaletteChange;
  const dragRef = useRef(onDragChange);
  dragRef.current = onDragChange;

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (e) => {
          if (!editable) return false;
          return hitIndex(e.nativeEvent.locationX, e.nativeEvent.locationY) != null;
        },
        onMoveShouldSetPanResponder: () => drag.current != null,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const index = hitIndex(e.nativeEvent.locationX, e.nativeEvent.locationY);
          if (index == null) return;
          const slot = paletteRef.current[index];
          if (slot?.x == null || slot.y == null) return;
          const start = mapRef.current.toView(slot.x, slot.y);
          drag.current = { index, x0: start.left, y0: start.top };
          setHold({ index, left: start.left, top: start.top });
          dragRef.current?.(true);
        },
        onPanResponderMove: (_e, g) => {
          const d = drag.current;
          if (!d) return;
          const left = d.x0 + g.dx;
          const top = d.y0 + g.dy;
          setHold({ index: d.index, left, top });
          const { x: nx, y: ny } = mapRef.current.toNorm(left, top);
          const src = uriRef.current;
          const apply = changeRef.current;
          if (!src || !apply) return;
          const id = (tick.current += 1);
          void sampleAt(src, nx, ny).then((picked) => {
            if (!picked || id !== tick.current) return;
            apply(
              paletteRef.current.map((slot, i) =>
                i === d.index ? { ...picked, ratio: slot.ratio } : slot,
              ),
            );
          });
        },
        onPanResponderRelease: finish,
        onPanResponderTerminate: finish,
      }),
    [editable],
  );

  function finish() {
    drag.current = null;
    setHold(null);
    dragRef.current?.(false);
  }

  function hitIndex(lx: number, ly: number) {
    const mapped = mapRef.current;
    let bestI = -1;
    let bestD = HIT;
    const slots = paletteRef.current;
    for (let i = 0; i < slots.length; i += 1) {
      const c = slots[i];
      if (c.x == null || c.y == null) continue;
      const p = mapped.toView(c.x, c.y);
      const dist = Math.hypot(lx - p.left, ly - p.top);
      if (dist < bestD) {
        bestD = dist;
        bestI = i;
      }
    }
    return bestI < 0 ? null : bestI;
  }

  if (!box.w || !box.h || !img.w || !img.h) return null;
  const mapped = mapRef.current;
  const marks = palette
    .map((c, index) => ({ c, index }))
    .filter(({ c }) => c.x != null && c.y != null && c.hex);
  if (!marks.length) return null;

  return (
    <View
      {...(editable ? pan.panHandlers : {})}
      pointerEvents={editable ? 'auto' : 'none'}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
    >
      {marks.map(({ c, index }) => {
        const pos =
          hold?.index === index ? { left: hold.left, top: hold.top } : mapped.toView(c.x!, c.y!);
        return (
          <View
            key={index}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: pos.left - MARK / 2,
              top: pos.top - MARK / 2,
              width: MARK,
              height: MARK,
              borderRadius: MARK / 2,
              backgroundColor: c.hex,
              borderWidth: 1.5,
              borderColor: '#F3EFE6',
            }}
          />
        );
      })}
    </View>
  );
}

function coverMap(box: { w: number; h: number }, img: { w: number; h: number }) {
  const iw = img.w || 1;
  const ih = img.h || 1;
  const scale = Math.max(box.w / iw, box.h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const ox = (box.w - dw) / 2;
  const oy = (box.h - dh) / 2;
  return {
    toView: (nx: number, ny: number) => ({
      left: ox + nx * dw,
      top: oy + ny * dh,
    }),
    toNorm: (left: number, top: number) => ({
      x: clamp01((left - ox) / dw),
      y: clamp01((top - oy) / dh),
    }),
  };
}

function clamp01(n: number) {
  return Math.min(0.98, Math.max(0.02, n));
}
