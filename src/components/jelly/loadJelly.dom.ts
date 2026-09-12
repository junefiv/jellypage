'use dom';

type JellyEl = HTMLElement & { built?: boolean };

let jellyLoad: Promise<void> | null = null;

export function loadJelly() {
  if (!jellyLoad) {
    jellyLoad = import('../../../vendor/jelly-ui/jelly.js').then(() => undefined);
  }
  return jellyLoad;
}

export async function whenJellyAlertBuilt(el: JellyEl) {
  await loadJelly();
  await customElements.whenDefined('jelly-alert');
  for (let i = 0; i < 60; i++) {
    if (el.built) return;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
}
