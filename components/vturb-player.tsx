'use client';

import {createElement,useEffect} from 'react';
import type {VturbConfig} from '@/lib/content';

export function VturbPlayer({config,title,onError}:{config:VturbConfig;title:string;onError:()=>void}){
  useEffect(()=>{
    let active=true;
    const script=document.createElement('script');
    script.src=config.scriptUrl;
    script.async=true;
    const failed=()=>{if(active)onError();};
    script.addEventListener('error',failed);
    // The embed initializes its current element when it executes. Run it again
    // when returning to the lesson; Next Script's deduplication skips that setup.
    // Deferral also cancels the discarded first effect in React Strict Mode.
    queueMicrotask(()=>{if(active)document.head.appendChild(script);});
    return ()=>{active=false;script.removeEventListener('error',failed);script.remove();};
  },[config.id,config.scriptUrl,onError]);
  return createElement('vturb-smartplayer',{
      id:config.id,
      style:{display:'block',margin:'0 auto',width:'100%',maxWidth:400},
      role:'region',
      'aria-label':title,
    },<div className="vturb-player-placeholder" style={{position:'relative',width:'100%',padding:'177.77777777777777% 0 0',zIndex:0,backgroundColor:'black'}}/>);
}
