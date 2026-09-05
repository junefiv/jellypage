import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { MeMark } from '@/src/components/ui/MeMark';
import { MonoText } from '@/src/components/ui/MonoText';
import { Tap } from '@/src/components/ui/Tap';
import { peekCity, resolveCity, warmCity } from '@/src/features/cam/city';
import { playShutterBoing } from '@/src/features/cam/shutterSound';
import { useDraft } from '@/src/features/cam/draft';
import { useDock } from '@/src/features/nav/dock';
import { extractPalette } from '@/src/palette/extract';
import { colors, copy } from '@/src/theme/tokens';

export default function CamScreen() {
  const camRef = useRef<CameraView>(null);
  const [perm, requestPerm] = useCameraPermissions();
  const [failUri, setFailUri] = useState<string | null>(null);
  const setDraft = useDraft((s) => s.setDraft);
  const setShooting = useDock((s) => s.setShooting);
  const registerShoot = useDock((s) => s.registerShoot);
  const busyRef = useRef(false);

  useEffect(() => {
    void warmCity();
  }, []);

  async function runExtract(uri: string) {
    busyRef.current = true;
    setShooting(true);
    try {
      void resolveCity();
      const result = await extractPalette(uri);
      const city = peekCity();
      const capturedAt = new Date().toISOString();
      if (!result.ok) {
        setFailUri(uri);
        setDraft({
          localUri: uri,
          palette: result.colors,
          city,
          capturedAt,
          source: 'raw',
          fail: true,
        });
        return;
      }
      setDraft({
        localUri: uri,
        palette: result.colors,
        city,
        capturedAt,
        source: 'capture',
        fail: false,
      });
      router.push('/take/preview');
    } finally {
      busyRef.current = false;
      setShooting(false);
    }
  }

  const extractRef = useRef(runExtract);
  extractRef.current = runExtract;

  useEffect(() => {
    registerShoot(() => {
      if (busyRef.current) return;
      void playShutterBoing();
      void camRef.current
        ?.takePictureAsync({ quality: 0.55, shutterSound: false })
        .then((shot) => {
          if (shot?.uri) void extractRef.current(shot.uri);
        });
    });
    return () => registerShoot(null);
  }, [registerShoot]);

  if (!perm?.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24 }}>
        <Tap label="CAM" onPress={() => void requestPerm()} />
      </View>
    );
  }

  if (failUri) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24, gap: 16 }}>
        <MonoText size={18}>{copy.paletteFail}</MonoText>
        <Tap
          label={copy.retry}
          onPress={() => {
            const uri = failUri;
            setFailUri(null);
            void runExtract(uri);
          }}
        />
        <Tap
          label={copy.saveRaw}
          onPress={() => {
            setFailUri(null);
            router.push('/take/preview');
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <CameraView
        ref={camRef}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        facing="back"
      />
      <MeMark inset />
    </View>
  );
}
