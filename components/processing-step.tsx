'use client';
import {useEffect,useState,type Ref} from 'react';
import type {QuizDefinition} from '@/lib/quiz-definition';
import {QuizIllustration} from './quiz-illustration';
import {QuizCTA} from './quiz-cta';

/** Keep the short progress animation local; the full quiz need not rerender every 80 ms. */
export function ProcessingStep({durationMs,copy,continueLabel,headingRef,ready,busy,error,onContinue}:{durationMs:number;copy:QuizDefinition['content']['flow']['processing'];continueLabel:string;headingRef:Ref<HTMLHeadingElement>;ready:boolean;busy:boolean;error:string;onContinue:()=>void}){
  const [processing,setProcessing]=useState(0);
  useEffect(()=>{
    if(!ready)return;
    const start=performance.now();
    const interval=setInterval(()=>setProcessing(Math.min(100,Math.floor((performance.now()-start)/durationMs*100))),80);
    const timeout=setTimeout(()=>{setProcessing(100);onContinue();},durationMs+120);
    return ()=>{clearInterval(interval);clearTimeout(timeout);};
  },[ready,onContinue,durationMs]);
  return <><h1 className="processing-heading" ref={headingRef} tabIndex={-1}>{copy.title}<br/><mark>{copy.highlight}</mark></h1><div className="processing-meter" role="progressbar" aria-label={copy.label} aria-valuenow={processing} aria-valuemin={0} aria-valuemax={100} style={{background:`conic-gradient(#f7ca00 ${processing}%,#edf0e8 0)`}}><span><QuizIllustration name="compass"/><strong>{processing}%</strong></span></div><div className="processing-checks">{copy.checks.map((line,i)=><div className={processing>=(i+1)*27?'done':''} key={line}>{processing>=(i+1)*27?<QuizIllustration name="check"/>:<QuizIllustration name="loading"/>}{line}</div>)}</div><p className="micro" role="status">{processing<100?copy.waiting:copy.ready}</p>{error&&<QuizCTA busy={busy} ready={ready} onClick={onContinue}>{continueLabel}</QuizCTA>}</>;
}
