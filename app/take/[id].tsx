import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import type { PaletteColor } from '@/src/palette/types';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { ChipStrip } from '@/src/components/ui/ChipStrip';
import { MonoText } from '@/src/components/ui/MonoText';
import { Screen } from '@/src/components/ui/Screen';
import { TakeFrame } from '@/src/components/ui/TakeFrame';
import { Tap } from '@/src/components/ui/Tap';
import { Well } from '@/src/components/ui/Well';
import { deleteTake, getMyTake, listMatches, originalSignedUrl, publicBlur, updateTakePalette } from '@/src/features/take/api';
import { follow, isFollowing } from '@/src/features/follow/api';
import { formatClock, formatDelta, formatTake } from '@/src/lib/format';
import { queryClient } from '@/src/lib/query';
import { colors, copy } from '@/src/theme/tokens';

export default function TakeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [seg, setSeg] = useState<'TAKE' | 'MATCH'>('TAKE');
  const [full, setFull] = useState(false);
  const [signed, setSigned] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  const [drag, setDrag] = useState(false);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  const takeQ = useQuery({
    queryKey: ['take', id],
    queryFn: () => getMyTake(id),
    enabled: Boolean(id),
    refetchInterval: (q) => (q.state.data?.match_status === 'pending' ? 2000 : false),
  });
  const take = takeQ.data;

  const matchQ = useQuery({
    queryKey: ['matches', id],
    queryFn: () => listMatches(id),
    enabled: Boolean(id) && seg === 'MATCH',
    refetchInterval: take?.match_status === 'pending' ? 2000 : false,
  });

  useEffect(() => {
    if (!take) return;
    const target = take.seq;
    setShown(0);
    const start = Date.now();
    const t = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 700);
      setShown(Math.max(1, Math.round(target * p)));
      if (p >= 1) clearInterval(t);
    }, 32);
    return () => clearInterval(t);
  }, [take?.id, take?.seq]);

  useEffect(() => {
    if (take?.original_path) {
      void originalSignedUrl(take.original_path).then(setSigned);
    }
  }, [take?.original_path]);

  useEffect(() => {
    if (take?.palette) setPalette(take.palette);
  }, [take?.id, take?.palette]);

  if (!take) {
    return (
      <Screen>
        <View style={{ padding: 16 }}>
          <MonoText dim>…</MonoText>
        </View>
      </Screen>
    );
  }

  const photo = signed ?? (take.blur_path ? publicBlur(take.blur_path) : null);

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView scrollEnabled={!drag} contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}>
        <MonoText size={20}>{formatTake(shown || take.seq)}</MonoText>
        <TakeFrame
          photoUri={photo}
          capturedAt={take.captured_at}
          geo={take.city}
          palette={palette.length ? palette : take.palette}
          clock={formatClock(take.captured_at)}
          onPhotoPress={() => {
            if (signed) setFull(true);
          }}
          onPaletteChange={(next) => {
            paletteRef.current = next;
            setPalette(next);
          }}
          onDragChange={(active) => {
            setDrag(active);
            if (!active && paletteRef.current.length) {
              void updateTakePalette(take.id, paletteRef.current).then(() => {
                void queryClient.invalidateQueries({ queryKey: ['take', id] });
                void queryClient.invalidateQueries({ queryKey: ['takes'] });
              });
            }
          }}
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Tap label={copy.takeSeg} dim={seg !== 'TAKE'} onPress={() => setSeg('TAKE')} />
          <Tap label={copy.matchSeg} dim={seg !== 'MATCH'} onPress={() => setSeg('MATCH')} />
          <Tap
            label="SHARE"
            onPress={async () => {
              if (photo && (await Sharing.isAvailableAsync())) {
                await Sharing.shareAsync(photo);
              }
            }}
          />
        </View>
        <Tap
          label={copy.deleteTake}
          danger
          onPress={async () => {
            await deleteTake(take.id, take.owner_id);
            await queryClient.invalidateQueries({ queryKey: ['takes'] });
            router.replace('/(tabs)/log');
          }}
        />

        {seg === 'MATCH' ? <MatchList pending={take.match_status === 'pending'} rows={matchQ.data} /> : null}
      </ScrollView>

      {full && signed ? (
        <Pressable
          onPress={() => setFull(false)}
          style={{ position: 'absolute', inset: 0, backgroundColor: colors.bg, justifyContent: 'center' }}
        >
          <Image source={{ uri: signed }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
        </Pressable>
      ) : null}
    </Screen>
  );
}

function MatchList({
  pending,
  rows,
}: {
  pending: boolean;
  rows?: Awaited<ReturnType<typeof listMatches>>;
}) {
  if (pending && !rows?.some((r) => r.target)) {
    return (
      <View style={{ paddingVertical: 24, alignItems: 'center' }}>
        <ActivityIndicator color={colors.fg} />
      </View>
    );
  }

  const list = rows ?? [1, 2, 3, 4, 5].map((rank) => ({
    rank,
    band: rank <= 3 ? 'open' : 'close',
    score: 0,
    delta: 0,
    target: null,
  })) as NonNullable<typeof rows>;

  return (
    <View style={{ gap: 10 }}>
      <MonoText>{copy.match5}</MonoText>
      <MonoText dim>{copy.openClose}</MonoText>
      {list.map((row) =>
        row.band === 'open' ? <OpenRow key={row.rank} row={row} /> : <CloseRow key={row.rank} row={row} />,
      )}
    </View>
  );
}

function OpenRow({ row }: { row: NonNullable<Awaited<ReturnType<typeof listMatches>>>[number] }) {
  const [following, setFollowing] = useState(false);
  useEffect(() => {
    if (row.target) void isFollowing(row.target.owner_id).then(setFollowing);
  }, [row.target?.owner_id]);

  if (!row.target) {
    return (
      <Well>
        <MonoText dim>{copy.noMatch}</MonoText>
      </Well>
    );
  }

  const blur = publicBlur(row.target.blur_path);
  return (
    <Pressable onPress={() => router.push(`/open/${row.target!.id}`)}>
      <Well style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              width: 52,
              height: 62,
              backgroundColor: colors.paper,
              padding: 4,
              paddingBottom: 8,
            }}
          >
            {blur ? (
              <Image source={{ uri: blur }} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View style={{ flex: 1, backgroundColor: colors.line }} />
            )}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <ChipStrip colors={row.target.palette} height={10} />
            <MonoText>@{row.target.handle}</MonoText>
            <MonoText dim size={11}>
              {row.target.city ?? '—'}  {formatClock(row.target.captured_at)}  {formatDelta(row.delta)}
            </MonoText>
          </View>
        </View>
        <Tap
          label={following ? copy.following : copy.follow}
          onPress={async () => {
            if (!following) {
              await follow(row.target!.owner_id);
              setFollowing(true);
            }
          }}
        />
      </Well>
    </Pressable>
  );
}

function CloseRow({ row }: { row: NonNullable<Awaited<ReturnType<typeof listMatches>>>[number] }) {
  if (!row.target) {
    return (
      <Well>
        <MonoText dim>{copy.noMatch}</MonoText>
      </Well>
    );
  }
  return (
    <Pressable onPress={() => router.push(`/close/${row.target!.id}?delta=${row.delta}`)}>
      <Well style={{ gap: 8 }}>
        <ChipStrip colors={row.target.palette} height={28} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <MonoText dim>
            {copy.lock}  {formatDelta(row.delta)}
          </MonoText>
          <MonoText dim>{copy.unlockSoon}</MonoText>
        </View>
      </Well>
    </Pressable>
  );
}
