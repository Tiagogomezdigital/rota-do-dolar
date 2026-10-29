'use client';
import {useCallback,useState} from 'react';

import {QuizIllustration} from '@/components/quiz-illustration';
import {VturbPlayer} from '@/components/vturb-player';
import {type VideoConfig} from '@/lib/content';
import {getVideoProgress,type VideoProgress} from '@/lib/video-progress';
type Props={config:VideoConfig;title:string;cta:string;onContinue:()=>void;busy?:boolean;vertical?:boolean;notice?:{text:string;emphasis:string}};
/** Playback gates remain the default; the main VSL explicitly uses an immediate CTA. */
export function GatedVideo(props:Props){
  const {src,embedUrl,revealAtSeconds,vturb,ctaMode}=props.config;
  // A new video or pitch time must never inherit the previous video's unlocked state.
  return <VideoSession key={JSON.stringify([src,embedUrl,revealAtSeconds,vturb?.id,vturb?.scriptUrl,ctaMode])} {...props}/>;
}
function VideoSession({config,title,cta,onContinue,busy=false,vertical=false,notice}:Props){
  const [{unlocked,watched},setProgress]=useState<VideoProgress>({unlocked:false,watched:0});
  const [mediaError,setMediaError]=useState(false);
  const playerFailed=useCallback(()=>setMediaError(true),[]);
  const configured=!!config.src||!!config.embedUrl||!!config.vturb;
  const showCTA=configured&&(config.ctaMode==='immediate'||(unlocked&&!mediaError));
  function playback(video:HTMLVideoElement){
    const played=Array.from({length:video.played.length},(_,index)=>({start:video.played.start(index),end:video.played.end(index)}));
    const progress=getVideoProgress(played,config.revealAtSeconds);
    setProgress(previous=>({...progress,unlocked:previous.unlocked||progress.unlocked}));
  }
  return <div className="gated-video">
    {config.vturb?<div className="vturb-video"><VturbPlayer config={config.vturb} title={title} onError={playerFailed}/></div>:configured?<div className={`video-frame ${vertical?'vertical':''}`}>
      {config.src?<video aria-label={title} controls playsInline preload="metadata" src={config.src} onError={()=>setMediaError(true)} onTimeUpdate={e=>{if(!e.currentTarget.paused&&!e.currentTarget.seeking)playback(e.currentTarget);}} onEnded={e=>playback(e.currentTarget)}/>:<iframe title={title} src={config.embedUrl} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/>}
    </div>:<div className={`video-placeholder ${vertical?'vertical':''}`}><QuizIllustration name="play" size="large"/><strong>{title}</strong><p>A aula estará disponível aqui em breve.</p></div>}
    {mediaError&&<p className="error" role="alert">Não foi possível carregar o vídeo. Tente novamente em instantes.</p>}
    {showCTA?<div className={notice?'offer-checkout':undefined}>{notice?<p className="offer-checkout-notice"><span className="offer-checkout-warning" aria-hidden="true">⚠️</span><span>{notice.text} <strong>{notice.emphasis}</strong></span></p>:<p className="unlock-note">Após assistir ao vídeo, aperte no botão abaixo para continuar.</p>}<button className={`cta ${notice?'offer-checkout-button':''}`} disabled={busy} onClick={onContinue}>{busy?'Abrindo…':cta}</button></div>:!config.vturb&&<p className="micro video-gate-note"><QuizIllustration name="lock"/>{configured?'O botão será liberado durante a aula.':'Assim que a aula estiver disponível, você poderá continuar por aqui.'}</p>}
    {configured&&!config.vturb&&config.ctaMode!=='immediate'&&<span className="sr-only" role="status">{unlocked?'Botão liberado':`${Math.floor(watched)} segundos assistidos`}</span>}
  </div>;
}
