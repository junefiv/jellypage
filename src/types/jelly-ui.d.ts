import type { DOMAttributes } from 'react';

type JellySize = 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
type JellyVariant = 'white' | 'rose' | 'amber' | 'azure' | 'mint' | 'platinum' | 'graphite';
type JellyAttrs = DOMAttributes<HTMLElement> & Record<string, unknown>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'jelly-theme': JellyAttrs & {
        mode?: 'auto' | 'light' | 'dark';
        accent?: string;
      };
      'jelly-button': JellyAttrs & {
        variant?: JellyVariant;
        size?: JellySize;
        shape?: 'pill' | 'square';
        type?: 'button' | 'submit' | 'reset';
        label?: string;
        disabled?: boolean;
        block?: boolean;
      };
      'jelly-icon-button': JellyAttrs & {
        variant?: JellyVariant;
        size?: JellySize;
        shape?: 'square' | 'circle';
        label?: string;
        disabled?: boolean;
      };
      'jelly-input': JellyAttrs & {
        value?: string;
        placeholder?: string;
        type?: string;
        label?: string;
        size?: JellySize;
        name?: string;
        disabled?: boolean;
        readonly?: boolean;
        autocomplete?: string;
      };
      'jelly-textarea': JellyAttrs & {
        value?: string;
        placeholder?: string;
        label?: string;
        rows?: number;
        size?: JellySize;
        name?: string;
        disabled?: boolean;
        readonly?: boolean;
      };
      'jelly-card': JellyAttrs & {
        squish?: boolean;
        size?: JellySize;
        label?: string;
      };
      'jelly-alert': JellyAttrs & {
        tone?: 'info' | 'success' | 'warning' | 'danger';
        size?: JellySize;
        dismissible?: boolean;
      };
      'jelly-switch': JellyAttrs & {
        checked?: boolean;
        disabled?: boolean;
        label?: string;
        size?: JellySize;
        variant?: JellyVariant;
        name?: string;
        value?: string;
      };
      'jelly-segmented': JellyAttrs & {
        value?: string;
        disabled?: boolean;
        size?: JellySize;
        roles?: 'radiogroup' | 'tablist';
        label?: string;
        name?: string;
      };
      'jelly-segment': JellyAttrs & {
        value?: string;
        selected?: boolean;
        disabled?: boolean;
      };
      'jelly-chip': JellyAttrs & {
        selected?: boolean;
        disabled?: boolean;
        selectable?: boolean;
        removable?: boolean;
        variant?: JellyVariant;
        shape?: 'pill' | 'square';
        size?: JellySize;
      };
      'jelly-spinner': JellyAttrs & {
        type?: 'dots' | 'blob';
        variant?: JellyVariant;
        size?: JellySize;
        label?: string;
      };
      'jelly-dialog': JellyAttrs & {
        open?: boolean;
        label?: string;
      };
      'jelly-menu': JellyAttrs & {
        placement?: 'top' | 'bottom' | 'left' | 'right' | 'start' | 'end';
        size?: JellySize;
      };
      'jelly-menu-item': JellyAttrs & {
        value?: string;
        disabled?: boolean;
        danger?: boolean;
      };
    }
  }
}

export {};
