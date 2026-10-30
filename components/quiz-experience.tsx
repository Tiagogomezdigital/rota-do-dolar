'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {preload} from 'react-dom';

import {Button,Progress,RadioGroup,RadioGroupItem} from '@/components/quiz-controls';
import {GatedVideo} from '@/components/gated-video';
import {JourneyChart} from '@/components/journey-chart';
import {QuizIllustration} from '@/components/quiz-illustration';
import {QuizPhoto} from '@/components/quiz-photo';
import {QuizCTA} from '@/components/quiz-cta';
import {ProcessingStep} from '@/components/processing-step';
import {warmVturbResources} from '@/components/vturb-resources';
import {sendJourney,JourneyError,type JourneyCommand,type JourneySnapshot as Snapshot} from '@/lib/journey-client';
import type {QuizDefinition} from '@/lib/quiz-definition';
export function QuizExperience({quiz}:{quiz:QuizDefinition}){
  const {content,questions,getSuggestion,processStep:PROCESS_STEP,storyStep:STORY_STEP,resultStep:RESULT_STEP,offerStep:OFFER_STEP,declinedStep:DECLINED_STEP}=quiz;
  const send=useCallback(<Command extends JourneyCommand,>(body:Command)=>sendJourney(body,{endpoint:quiz.apiPath}),[quiz.apiPath]);
  const [step,setStep]=useState(0),[answers,setAnswers]=useState<Record<string,string>>({}),[selected,setSelected]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const lock=useRef(false),revision=useRef<number|undefined>(undefined),initRef=useRef<Promise<Snapshot>|null>(null),headingRef=useRef<HTMLHeadingElement>(null),[retry,setRetry]=useState(0);
  const question=step>0&&step<=questions.length?questions[step-1]:null;
  const recover=useCallback((failure:unknown)=>{if(failure instanceof JourneyError&&failure.snapshot){revision.current=failure.snapshot.revision;setStep(failure.snapshot.step);setAnswers(failure.snapshot.answers);setSelected(failure.snapshot.answers[questions[failure.snapshot.step-1]?.id]||'');}setError((failure as Error).message);},[questions]);
  useEffect(()=>{let mounted=true;if(!initRef.current){const p=new URLSearchParams(location.search);initRef.current=send({action:'init',source:p.get('utm_source')||'direto',device:innerWidth<768?'mobile':'desktop'});}initRef.current.then(data=>{if(!mounted)return;revision.current=data.revision;setStep(data.step);setAnswers(data.answers);setSelected(data.answers[questions[data.step-1]?.id]||'');setReady(true);setError('');}).catch(e=>{if(mounted){setError(e.message);initRef.current=null;}});return()=>{mounted=false;};},[retry,send,questions]);
  useEffect(()=>{if(step===RESULT_STEP||step===OFFER_STEP)warmVturbResources(content.offer.video.vturb);},[step,RESULT_STEP,OFFER_STEP,content.offer.video.vturb]);
  useEffect(()=>{
    if(step===PROCESS_STEP)preload(content.expert.imageAvifSrcSet.split(' ')[0],{as:'image',type:'image/avif',imageSrcSet:content.expert.imageAvifSrcSet,imageSizes:'(max-width: 668px) calc(100vw - 48px), 620px'});
    if(step===STORY_STEP)preload(content.result.accessBanner.src,{as:'image',imageSrcSet:content.result.accessBanner.srcSet,imageSizes:'(max-width: 668px) calc(100vw - 48px), 620px'});
  },[step,PROCESS_STEP,STORY_STEP,content.expert.imageAvifSrcSet,content.result.accessBanner.src,content.result.accessBanner.srcSet]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});if(step)headingRef.current?.focus({preventScroll:true});},[step]);
  const navigate=useCallback(async(target:number)=>{if(lock.current||!ready)return;lock.current=true;setBusy(true);setError('');try{const data=await send({action:'view',step:target,expectedStep:step,expectedRevision:revision.current});revision.current=data.revision;setSelected(answers[questions[data.step-1]?.id]||'');setStep(data.step);}catch(e){recover(e);}finally{lock.current=false;setBusy(false);}},[ready,step,answers,recover,send,questions]);
  const continueFromProcessing=useCallback(()=>{void navigate(STORY_STEP);},[navigate,STORY_STEP]);
  async function answer(value:string){if(!question||lock.current||!ready)return;setSelected(value);lock.current=true;setBusy(true);setError('');try{const data=await send({action:'answer',questionId:question.id,optionId:value,expectedStep:step,expectedRevision:revision.current});revision.current=data.revision;const nextAnswers={...answers,[question.id]:value};setAnswers(nextAnswers);setSelected(nextAnswers[questions[data.step-1]?.id]||'');setStep(data.step);}catch(e){recover(e);}finally{lock.current=false;setBusy(false);}}
  async function finalAction(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{const data=await send({action:'cta',expectedStep:step,expectedRevision:revision.current});revision.current=data.revision;window.location.assign(content.offer.checkoutUrl);}catch(e){recover(e);}finally{lock.current=false;setBusy(false);}}
  const suggestion=getSuggestion(answers),progress=step===0?0:step===DECLINED_STEP?0:Math.min(100,Math.round(step/OFFER_STEP*100));
  return <main data-quiz={quiz.id} className={`quiz-shell script-quiz ${step===0?'opening':''} ${step===RESULT_STEP?'result':''}`}>
    <Progress className="quiz-progress" value={progress} aria-label="Progresso da experiência"/>
    <section className={`quiz-content ${question?'question-content':''} ${step===OFFER_STEP?'offer-content':''}`} key={step} aria-busy={busy}>
      {step===0&&<>
        <div className="opening-copy"><h1 ref={headingRef} tabIndex={-1}>{content.hero.title} <mark>{content.hero.highlight}</mark> {content.hero.ending} <mark>{content.hero.closingHighlight}</mark></h1><p className="lead">{content.hero.description}</p></div>
        <div className="opening-visual"><QuizPhoto avifSrcSet={content.hero.imageAvifSrcSet} className="hero-photo" src={content.hero.imageUrl} srcSet={content.hero.imageSrcSet} sizes="(max-width: 688px) calc(100vw - 48px), 640px" alt={content.flow.heroAlt} width={1536} height={1024} fetchPriority="high"/><p className="social-proof"><em><span className="social-proof-emoji" aria-hidden="true">⚡</span>{' '}{content.hero.socialProof.firstLine}<br/>{content.hero.socialProof.secondLine}</em></p></div>
        <div className="opening-action"><div className="opening-cta"><QuizCTA busy={busy} ready={ready} onClick={()=>void navigate(1)}>{ready?content.hero.cta:content.flow.preparing}</QuizCTA></div></div>
      </>}
      {question&&<>
        {question.id==='compromisso'&&<div className="gift-intro"><div className="gift-art"><QuizIllustration name="gift" size="large"/></div><h2>{content.flow.commitmentTitle}</h2><p>{question.description}</p></div>}
        <h1 ref={headingRef} tabIndex={-1}>{question.title}</h1>
        {question.id!=='compromisso'&&<p className="question-note">{question.description}</p>}
        <RadioGroup className={`answers ${question.id==='compromisso'?'commitment-answers':''}`} value={selected} disabled={busy||!ready} onValueChange={setSelected} aria-label={question.title}>
          {question.options.map(option=><label className={`answer ${busy?'saving':''}`} key={option.id} onClick={e=>{if(!busy&&ready&&e.detail>0){if(!(e.target instanceof HTMLInputElement))e.preventDefault();void answer(option.id);}}}><span className="answer-icon"><QuizIllustration emoji={option.icon}/></span><span className="answer-label">{option.label}{option.description&&<span className="answer-description">{option.description}</span>}</span><RadioGroupItem value={option.id} aria-label={option.label}/></label>)}
        </RadioGroup><p className="micro">{content.flow.chooseOption}</p>
        {selected&&<Button className="cta" disabled={busy||!ready} onClick={()=>void answer(selected)}>{busy?content.flow.saving:content.flow.continue}</Button>}
      </>}
      {step===PROCESS_STEP&&<ProcessingStep durationMs={quiz.processDurationMs} copy={content.flow.processing} continueLabel={content.flow.continue} headingRef={headingRef} ready={ready} busy={busy} error={error} onContinue={continueFromProcessing}/>}
      {step===STORY_STEP&&<><div className="expert-scene"><QuizPhoto avifSrcSet={content.expert.imageAvifSrcSet} src={content.expert.imageUrl} srcSet={content.expert.imageSrcSet} sizes="(max-width: 668px) calc(100vw - 48px), 620px" decoding="async" alt={content.flow.expertAlt} width={1536} height={1024}/></div><p className="image-caption">{content.flow.expertCaption}</p><h1 ref={headingRef} tabIndex={-1}>{content.expert.title}</h1><div className="expert-story">{content.expert.paragraphs.map(p=><p className="lead" key={p}>{p}</p>)}</div><QuizCTA busy={busy} ready={ready} onClick={()=>void navigate(RESULT_STEP)}>{content.expert.cta}</QuizCTA></>}
      {step===RESULT_STEP&&<><img className="access-banner-image" src={content.result.accessBanner.src} srcSet={content.result.accessBanner.srcSet} sizes="(max-width: 668px) calc(100vw - 48px), 620px" alt={content.result.accessBanner.alt} width={1240} height={414} decoding="async"/><h1 className="result-title" ref={headingRef} tabIndex={-1}><span>{content.flow.result.title}</span>{' '}<mark>{content.flow.result.highlight}</mark></h1><p className="lead">{content.flow.result.description}</p><JourneyChart/><div className="target-cards"><div><span className="target-percent">10%</span><span className="target-bar"><i style={{height:'10%'}}/></span><small>{content.result.comparison.today}</small><strong>{content.flow.result.todayAmount}</strong></div><div><span className="target-percent">100%</span><span className="target-bar"><i style={{height:'100%'}}/></span><small>{content.result.comparison.future}</small><strong>{content.flow.result.futureAmount}</strong></div></div><dl className="personal-summary"><div><dt>{content.flow.result.goal}</dt><dd>{suggestion.goal}</dd></div><div><dt>{content.flow.result.dream}</dt><dd>{suggestion.dream}</dd></div><div><dt>{content.flow.result.dailyTarget}</dt><dd>{suggestion.dailyTarget}</dd></div><div><dt>{content.flow.result.time}</dt><dd>{suggestion.time} {content.flow.result.perDay}</dd></div></dl><img className="partner-banner-image" src={content.result.partnerBanner.src} srcSet={content.result.partnerBanner.srcSet} sizes="(max-width: 668px) calc(100vw - 48px), 620px" alt={content.result.partnerBanner.alt} width={1240} height={414} decoding="async" loading="lazy"/></>}
      {step===OFFER_STEP&&<><h1 className="offer-title" ref={headingRef} tabIndex={-1}>{content.offer.title.intro}{' '}<mark>{content.offer.title.highlight}</mark>{' '}{content.offer.title.unit}{' '}{content.offer.title.ending}</h1><p className="lead">{content.offer.description}</p><GatedVideo config={content.offer.video} title={content.flow.videoTitle} cta={content.offer.cta} notice={content.offer.notice} busy={busy} onContinue={()=>void finalAction()} vertical/></>}
      {step===DECLINED_STEP&&<><h1 ref={headingRef} tabIndex={-1}>{content.flow.declined.title}<br/><mark>{content.flow.declined.highlight}</mark></h1><p className="lead">{content.flow.declined.description}</p></>}
      {error&&<div className="error" role="alert">{error}{!ready&&<Button variant="outline" onClick={()=>setRetry(n=>n+1)}>{content.flow.retry}</Button>}</div>}
    </section>
    {step===RESULT_STEP&&<div className="result-cta"><QuizCTA busy={busy} ready={ready} onClick={()=>void navigate(OFFER_STEP)}>{content.result.cta}</QuizCTA></div>}
  </main>;
}
