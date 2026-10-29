'use client';
import {useEffect,useState,type Ref} from 'react';
import {PROCESS_DURATION_MS} from '@/lib/content';
import {QuizIllustration} from './quiz-illustration';
import {QuizCTA} from './quiz-cta';

/** Keep the short progress animation local; the full quiz need not rerender every 80 ms. */
export function ProcessingStep({headingRef,ready,busy,error,onContinue}:{headingRef:Ref<HTMLHeadingElement>;ready:boolean;busy:boolean;error:string;onContinue:()=>void}){
  const [processing,setProcessing]=useState(0);
  useEffect(()=>{
    if(!ready)return;
    const start=performance.now();
    const interval=setInterval(()=>setProcessing(Math.min(100,Math.floor((performance.now()-start)/PROCESS_DURATION_MS*100))),80);
    const timeout=setTimeout(()=>{setProcessing(100);onContinue();},PROCESS_DURATION_MS+120);
    return ()=>{clearInterval(interval);clearTimeout(timeout);};
  },[ready,onContinue]);
  return <><h1 className="processing-heading" ref={headingRef} tabIndex={-1}>Seu próximo passo<br/><mark>começa aqui.</mark></h1><div className="processing-meter" role="progressbar" aria-label="Preparando resumo das respostas" aria-valuenow={processing} aria-valuemin={0} aria-valuemax={100} style={{background:`conic-gradient(#f7ca00 ${processing}%,#edf0e8 0)`}}><span><QuizIllustration name="compass"/><strong>{processing}%</strong></span></div><div className="processing-checks">{['Reunindo suas respostas','Organizando seus objetivos','Preparando seu acesso à apresentação'].map((line,i)=><div className={processing>=(i+1)*27?'done':''} key={line}>{processing>=(i+1)*27?<QuizIllustration name="check"/>:<QuizIllustration name="loading"/>}{line}</div>)}</div><p className="micro" role="status">{processing<100?'Aguarde um instante…':'Tudo pronto para continuar.'}</p>{error&&<QuizCTA busy={busy} ready={ready} onClick={onContinue}>Continuar</QuizCTA>}</>;
}
