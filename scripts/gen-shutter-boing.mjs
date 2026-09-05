import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleRate = 44100;
const duration = 0.3;
const numSamples = Math.floor(sampleRate * duration);
const f0 = 540;
const f1 = 165;

const samples = new Float32Array(numSamples);
let phase = 0;

for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const env = Math.exp(-t * 11) * (1 - Math.exp(-t * 90));
  const f = f1 + (f0 - f1) * Math.exp(-t * 8.5);
  phase += (2 * Math.PI * f) / sampleRate;
  const wobble = 1 + 0.12 * Math.sin(t * 36);
  samples[i] = Math.sin(phase) * env * wobble * 0.5;
}

const buffer = Buffer.alloc(44 + numSamples * 2);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples * 2, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(numSamples * 2, 40);

for (let i = 0; i < numSamples; i++) {
  const s = Math.max(-1, Math.min(1, samples[i]));
  buffer.writeInt16LE(Math.floor(s * 32767), 44 + i * 2);
}

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'shutter-boing.wav'), buffer);
console.log('wrote assets/sounds/shutter-boing.wav');
