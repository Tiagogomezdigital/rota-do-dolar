'use client';
import {useState} from 'react';
import {LockKeyhole,PlayCircle} from 'lucide-react';
import {type VideoConfig} from '@/lib/content';
import {getVideoProgress,type VideoProgress} from '@/lib/video-progress';
type Props={config:VideoConfig;title:string;cta:string;onContinue:()=>void;busy?:boolean;vertical?:boolean};
/** Reveal only from playback events. An unconfigured video never starts a page timer. */
export function GatedVideo(props:Props){
  const {src,embedUrl,revealAtSeconds}=props.config;
  // A new video or pitch time must never inherit the previous video's unlocked state.
  return <VideoSession key={JSON.stringify([src,embedUrl,revealAtSeconds])} {...props}/>;
}
function VideoSession({config,title,cta,onContinue,busy=false,vertical=false}:Props){
  const [{unlocked,watched},setProgress]=useState<VideoProgress>({unlocked:false,watched:0});
  const [mediaError,setMediaError]=useState(false);
  const configured=!!config.src||!!config.embedUrl;
  function playback(video:HTMLVideoElement){
    const played=Array.from({length:video.played.length},(_,index)=>({start:video.played.start(index),end:video.played.end(index)}));
    const progress=getVideoProgress(played,config.revealAtSeconds);
    setProgress(previous=>({...progress,unlocked:previous.unlocked||progress.unlocked}));
  }
  return <div className="gated-video">
    {configured?<div className={`video-frame ${vertical?'vertical':''}`}>
      {config.src?<video aria-label={title} controls playsInline preload="metadata" src={config.src} onError={()=>setMediaError(true)} onTimeUpdate={e=>{if(!e.currentTarget.paused&&!e.currentTarget.seeking)playback(e.currentTarget);}} onEnded={e=>playback(e.currentTarget)}/>:<iframe title={title} src={config.embedUrl} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/>}
    </div>:<div className={`video-placeholder ${vertical?'vertical':''}`}><PlayCircle size={42} aria-hidden="true"/><strong>{title}</strong><p>A aula estará disponível aqui em breve.</p></div>}
    {mediaError&&<p className="error" role="alert">Não foi possível carregar o vídeo. Tente novamente em instantes.</p>}
    {unlocked&&!mediaError?<><p className="unlock-note">Após assistir ao vídeo, aperte no botão abaixo para continuar.</p><button className="cta" disabled={busy} onClick={onContinue}>{busy?'Abrindo…':cta}</button></>:<p className="micro video-gate-note"><LockKeyhole size={14}/>{configured?'O botão será liberado durante a aula.':'Assim que a aula estiver disponível, você poderá continuar por aqui.'}</p>}
    {configured&&<span className="sr-only" role="status">{unlocked?'Botão liberado':`${Math.floor(watched)} segundos assistidos`}</span>}
  </div>;
}
