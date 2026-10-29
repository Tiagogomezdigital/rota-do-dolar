import type {DetailedHTMLProps,HTMLAttributes} from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'vturb-smartplayer':DetailedHTMLProps<HTMLAttributes<HTMLElement>,HTMLElement>;
    }
  }
}
