'use dom';

import type { DOMProps } from 'expo/dom';

import '../../../vendor/jelly-ui/jelly.js';

type Props = {
  dom?: DOMProps;
};

export default function JellyCardDom(_props: Props) {
  return (
    <div style={{ display: 'block', width: '100%', minHeight: 56, background: 'transparent' }}>
      <jelly-theme mode="dark">
        <jelly-card style={{ display: 'block', width: '100%', minHeight: 56 }}>
          <span style={{ opacity: 0, userSelect: 'none' }}>.</span>
        </jelly-card>
      </jelly-theme>
    </div>
  );
}
