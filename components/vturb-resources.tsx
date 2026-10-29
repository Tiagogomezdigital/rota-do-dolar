'use client';

import type {VturbConfig} from '@/lib/content';

function resource(href:string,as?:'script'|'fetch'){
  const absoluteHref=new URL(href,document.baseURI).href;
  const rel=as?'preload':'dns-prefetch';
  const existing=Array.from(document.head.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`));
  if(existing.some(link=>link.href===absoluteHref&&(!as||link.as===as)))return;
  const link=document.createElement('link');
  link.rel=rel;
  link.href=absoluteHref;
  if(as)link.as=as;
  if(as==='fetch')link.crossOrigin='anonymous';
  document.head.appendChild(link);
}

/** Warm the next lesson without competing with the opening screen's image and JS. */
export function warmVturbResources(config?:VturbConfig){
  if(!config||typeof document==='undefined')return;
  for(const origin of ['https://cdn.converteai.net','https://scripts.converteai.net','https://images.converteai.net','https://license.vturb.com'])resource(origin);
  resource(config.scriptUrl,'script');
  resource('https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js','script');
  resource(config.mediaPreloadUrl,'fetch');
}
