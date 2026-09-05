import type { DOMAttributes } from 'react';

type JellyAttrs = DOMAttributes<HTMLElement> & Record<string, unknown>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'jelly-theme': JellyAttrs & { mode?: 'auto' | 'light' | 'dark' };
      'jelly-button': JellyAttrs & {
        variant?: 'white' | 'rose' | 'amber' | 'azure' | 'mint' | 'platinum' | 'graphite';
        size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
        shape?: 'square';
        label?: string;
        disabled?: boolean;
        block?: boolean;
      };
      'jelly-icon-button': JellyAttrs & {
        variant?: 'white' | 'rose' | 'amber' | 'azure' | 'mint' | 'platinum' | 'graphite';
        size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
        shape?: 'square' | 'circle';
        label?: string;
        disabled?: boolean;
      };
      'jelly-input': JellyAttrs & {
        value?: string;
        placeholder?: string;
        label?: string;
        size?: 'sm' | 'md' | 'lg';
        disabled?: boolean;
      };
      'jelly-card': JellyAttrs & { label?: string };
    }
  }
}

export {};
