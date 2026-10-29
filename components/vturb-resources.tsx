'use client';

import {preload,prefetchDNS} from 'react-dom';
import {content} from '@/lib/content';

/** Preload the supplied assets without executing the player on the quiz's opening screen. */
export function VturbResources(){
  const config=content.offer.video.vturb;
  if(!config)return null;
  preload(config.scriptUrl,{as:'script'});
  preload('https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js',{as:'script'});
  preload(config.mediaPreloadUrl,{as:'fetch',crossOrigin:'anonymous'});
  for(const origin of ['https://cdn.converteai.net','https://scripts.converteai.net','https://images.converteai.net','https://license.vturb.com'])prefetchDNS(origin);
  return null;
}
