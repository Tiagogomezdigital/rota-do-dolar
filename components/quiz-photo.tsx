import type {ComponentProps} from 'react';

/** Preserve the original WebP and layout while offering a smaller modern encoding. */
export function QuizPhoto({avifSrcSet,alt,...props}:ComponentProps<'img'>&{avifSrcSet:string;alt:string}){
  return <picture style={{display:'contents'}}><source type="image/avif" srcSet={avifSrcSet} sizes={props.sizes}/><img alt={alt} {...props}/></picture>;
}
