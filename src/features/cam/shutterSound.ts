const source = require('../../../assets/sounds/shutter-boing.wav');

type AudioPlayer = {
  seekTo: (seconds: number) => Promise<void>;
  play: () => void;
};

let player: AudioPlayer | null = null;
let modeReady = false;
let unavailable = false;

export async function playShutterBoing() {
  if (unavailable) return;
  try {
    const { createAudioPlayer, setAudioModeAsync } = await import('expo-audio');
    if (!modeReady) {
      await setAudioModeAsync({ playsInSilentMode: true });
      modeReady = true;
    }
    if (!player) player = createAudioPlayer(source);
    await player.seekTo(0);
    player.play();
  } catch {
    unavailable = true;
  }
}
