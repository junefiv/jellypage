import { Buffer } from 'buffer';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { useSession } from '@/src/features/auth/session';
import { queryClient } from '@/src/lib/query';
import { colors } from '@/src/theme/tokens';

if (!(globalThis as { Buffer?: typeof Buffer }).Buffer) {
  (globalThis as { Buffer?: typeof Buffer }).Buffer = Buffer;
}

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.fg,
    border: colors.line,
    primary: colors.fg,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const hydrate = useSession((s) => s.hydrate);
  const ready = useSession((s) => s.ready);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (loaded && ready) SplashScreen.hideAsync();
  }, [loaded, ready]);

  if (!loaded || !ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="me" />
          <Stack.Screen name="take/[id]" />
          <Stack.Screen name="take/preview" />
          <Stack.Screen name="match/[id]" />
          <Stack.Screen name="open/[takeId]" />
          <Stack.Screen name="close/[takeId]" />
          <Stack.Screen name="user/[handle]" />
          <Stack.Screen name="dm/[threadId]" />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
