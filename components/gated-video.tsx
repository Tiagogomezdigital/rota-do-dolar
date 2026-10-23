'use client';
import {useEffect,useRef,useState} from 'react';
import {LockKeyhole,PlayCircle} from 'lucide-react';
import {type VideoConfig} from '@/lib/content';
type Props={config:VideoConfig;title:string;cta:string;onContinue:()=>void;busy?:boolean;vertical?:boolean};
/** Reveal only from playback events. An unconfigured video never starts a page timer. */
export function GatedVideo({config,title,cta,onContinue,busy=false,vertical=false}:Props){
  const [unlocked,setUnlocked]=useState(false),[mediaError,setMediaError]=useState(false);
  const [watched,setWatched]=useState(0),lastTime=useRef(0);
  const configured=!!config.src||!!config.embedUrl;
  const delayReady=typeof config.revealAtSeconds==='number'&&Number.isFinite(config.revealAtSeconds)&&config.revealAtSeconds>=0;
  useEffect(()=>{setUnlocked(false);setWatched(0);setMediaError(false);lastTime.current=0;},[config.src,config.embedUrl,config.revealAtSeconds]);
  function playback(time:number){
    const delta=time-lastTime.current;lastTime.current=time;
    if(delta<=0||delta>2)return;
    setWatched(prev=>{const next=prev+delta;if(delayReady&&next>=config.revealAtSeconds!)setUnlocked(true);return next;});
  }
  return <div className="gated-video">
    {configured?<div className={`video-frame ${vertical?'vertical':''}`}>
      {config.src?<video aria-label={title} controls playsInline preload="metadata" src={config.src} onError={()=>setMediaError(true)} onSeeked={e=>{lastTime.current=e.currentTarget.currentTime;}} onTimeUpdate={e=>{if(!e.currentTarget.paused)playback(e.currentTarget.currentTime);}}/>:<iframe title={title} src={config.embedUrl} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/>}
    </div>:<div className={`video-placeholder ${vertical?'vertical':''}`}><PlayCircle size={42} aria-hidden="true"/><strong>{title}</strong><p>A aula estará disponível aqui em breve.</p></div>}
    {mediaError&&<p className="error" role="alert">Não foi possível carregar o vídeo. Tente novamente em instantes.</p>}
    {unlocked&&!mediaError?<><p className="unlock-note">Após assistir ao vídeo, aperte no botão abaixo para continuar.</p><button className="cta" disabled={busy} onClick={onContinue}>{busy?'Abrindo…':cta}</button></>:<p className="micro video-gate-note"><LockKeyhole size={14}/>{configured?'O botão será liberado durante a aula.':'Assim que a aula estiver disponível, você poderá continuar por aqui.'}</p>}
    {configured&&<span className="sr-only" role="status">{unlocked?'Botão liberado':`${Math.floor(watched)} segundos assistidos`}</span>}
  </div>;
}
