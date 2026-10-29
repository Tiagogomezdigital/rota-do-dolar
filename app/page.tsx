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
import {sendJourney as send,JourneyError,type JourneySnapshot as Snapshot} from '@/lib/journey-client';
import {content,questions,PROCESS_STEP,STORY_STEP,RESULT_STEP,OFFER_STEP,DECLINED_STEP,getSuggestion} from '@/lib/content';
export default function Home(){
  const [step,setStep]=useState(0),[answers,setAnswers]=useState<Record<string,string>>({}),[selected,setSelected]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const lock=useRef(false),revision=useRef<number|undefined>(undefined),initRef=useRef<Promise<Snapshot>|null>(null),headingRef=useRef<HTMLHeadingElement>(null),[retry,setRetry]=useState(0);
  const question=step>0&&step<=questions.length?questions[step-1]:null;
  const recover=useCallback((failure:unknown)=>{if(failure instanceof JourneyError&&failure.snapshot){revision.current=failure.snapshot.revision;setStep(failure.snapshot.step);setAnswers(failure.snapshot.answers);setSelected(failure.snapshot.answers[questions[failure.snapshot.step-1]?.id]||'');}setError((failure as Error).message);},[]);
  useEffect(()=>{let mounted=true;if(!initRef.current){const p=new URLSearchParams(location.search);initRef.current=send({action:'init',source:p.get('utm_source')||'direto',device:innerWidth<768?'mobile':'desktop'});}initRef.current.then(data=>{if(!mounted)return;revision.current=data.revision;setStep(data.step);setAnswers(data.answers);setSelected(data.answers[questions[data.step-1]?.id]||'');setReady(true);setError('');}).catch(e=>{if(mounted){setError(e.message);initRef.current=null;}});return()=>{mounted=false;};},[retry]);
  useEffect(()=>{if(step===RESULT_STEP||step===OFFER_STEP)warmVturbResources(content.offer.video.vturb);},[step]);
  useEffect(()=>{
    if(step===PROCESS_STEP)preload(content.expert.imageAvifSrcSet.split(' ')[0],{as:'image',type:'image/avif',imageSrcSet:content.expert.imageAvifSrcSet,imageSizes:'(max-width: 668px) calc(100vw - 48px), 620px'});
    if(step===STORY_STEP)preload(content.result.accessBanner.src,{as:'image',imageSrcSet:content.result.accessBanner.srcSet,imageSizes:'(max-width: 668px) calc(100vw - 48px), 620px'});
  },[step]);
  useEffect(()=>{window.scrollTo({top:0,behavior:'instant'});if(step)headingRef.current?.focus({preventScroll:true});},[step]);
  const navigate=useCallback(async(target:number)=>{if(lock.current||!ready)return;lock.current=true;setBusy(true);setError('');try{const data=await send({action:'view',step:target,expectedStep:step,expectedRevision:revision.current});revision.current=data.revision;setSelected(answers[questions[data.step-1]?.id]||'');setStep(data.step);}catch(e){recover(e);}finally{lock.current=false;setBusy(false);}},[ready,step,answers,recover]);
  const continueFromProcessing=useCallback(()=>{void navigate(STORY_STEP);},[navigate]);
  async function answer(value:string){if(!question||lock.current||!ready)return;setSelected(value);lock.current=true;setBusy(true);setError('');try{const data=await send({action:'answer',questionId:question.id,optionId:value,expectedStep:step,expectedRevision:revision.current});revision.current=data.revision;const nextAnswers={...answers,[question.id]:value};setAnswers(nextAnswers);setSelected(nextAnswers[questions[data.step-1]?.id]||'');setStep(data.step);}catch(e){recover(e);}finally{lock.current=false;setBusy(false);}}
  async function finalAction(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{const data=await send({action:'cta',expectedStep:step,expectedRevision:revision.current});revision.current=data.revision;window.location.assign(content.offer.checkoutUrl);}catch(e){recover(e);}finally{lock.current=false;setBusy(false);}}
  const suggestion=getSuggestion(answers),progress=step===0?0:step===DECLINED_STEP?0:Math.min(100,Math.round(step/OFFER_STEP*100));
  return <main className={`quiz-shell script-quiz ${step===0?'opening':''} ${step===RESULT_STEP?'result':''}`}>
    <Progress className="quiz-progress" value={progress} aria-label="Progresso da experiência"/>
    <section className={`quiz-content ${question?'question-content':''} ${step===OFFER_STEP?'offer-content':''}`} key={step} aria-busy={busy}>
      {step===0&&<>
        <div className="opening-copy"><h1 ref={headingRef} tabIndex={-1}>{content.hero.title} <mark>{content.hero.highlight}</mark> {content.hero.ending} <mark>{content.hero.closingHighlight}</mark></h1><p className="lead">{content.hero.description}</p></div>
        <div className="opening-visual"><QuizPhoto avifSrcSet={content.hero.imageAvifSrcSet} className="hero-photo" src={content.hero.imageUrl} srcSet={content.hero.imageSrcSet} sizes="(max-width: 688px) calc(100vw - 48px), 640px" alt="Montagem ilustrativa de Tiago Gomez em Paris, em viagens e com sua família e carro" width={1536} height={1024} fetchPriority="high"/><p className="social-proof"><em><span className="social-proof-emoji" aria-hidden="true">⚡</span>{' '}{content.hero.socialProof.firstLine}<br/>{content.hero.socialProof.secondLine}</em></p></div>
        <div className="opening-action"><div className="opening-cta"><QuizCTA busy={busy} ready={ready} onClick={()=>void navigate(1)}>{ready?content.hero.cta:'Preparando sua experiência…'}</QuizCTA></div></div>
      </>}
      {question&&<>
        {question.id==='compromisso'&&<div className="gift-intro"><div className="gift-art"><QuizIllustration name="gift" size="large"/></div><h2>PARABÉNS! O seu acesso à Rota do Dólar com IA será liberado no final deste miniquestionário!</h2><p>{question.description}</p></div>}
        <h1 ref={headingRef} tabIndex={-1}>{question.title}</h1>
        {question.id!=='compromisso'&&<p className="question-note">{question.description}</p>}
        <RadioGroup className={`answers ${question.id==='compromisso'?'commitment-answers':''}`} value={selected} disabled={busy||!ready} onValueChange={setSelected} aria-label={question.title}>
          {question.options.map(option=><label className={`answer ${busy?'saving':''}`} key={option.id} onClick={e=>{if(!busy&&ready&&e.detail>0){if(!(e.target instanceof HTMLInputElement))e.preventDefault();void answer(option.id);}}}><span className="answer-icon"><QuizIllustration emoji={option.icon}/></span><span className="answer-label">{option.label}{option.description&&<span className="answer-description">{option.description}</span>}</span><RadioGroupItem value={option.id} aria-label={option.label}/></label>)}
        </RadioGroup><p className="micro">Escolha uma opção para avançar.</p>
        {selected&&<Button className="cta" disabled={busy||!ready} onClick={()=>void answer(selected)}>{busy?'Salvando…':'Continuar'}</Button>}
      </>}
      {step===PROCESS_STEP&&<ProcessingStep headingRef={headingRef} ready={ready} busy={busy} error={error} onContinue={continueFromProcessing}/>}
      {step===STORY_STEP&&<><div className="expert-scene"><QuizPhoto avifSrcSet={content.expert.imageAvifSrcSet} src={content.expert.imageUrl} srcSet={content.expert.imageSrcSet} sizes="(max-width: 668px) calc(100vw - 48px), 620px" decoding="async" alt="Montagem ilustrativa de Tiago e sua família" width={1536} height={1024}/></div><p className="image-caption">Montagem ilustrativa com IA.</p><h1 ref={headingRef} tabIndex={-1}>{content.expert.title}</h1><div className="expert-story">{content.expert.paragraphs.map(p=><p className="lead" key={p}>{p}</p>)}</div><QuizCTA busy={busy} ready={ready} onClick={()=>void navigate(RESULT_STEP)}>{content.expert.cta}</QuizCTA></>}
      {step===RESULT_STEP&&<><img className="access-banner-image" src={content.result.accessBanner.src} srcSet={content.result.accessBanner.srcSet} sizes="(max-width: 668px) calc(100vw - 48px), 620px" alt={content.result.accessBanner.alt} width={1240} height={414} decoding="async"/><h1 className="result-title" ref={headingRef} tabIndex={-1}><span>A SUA JORNADA NOS</span>{' '}<mark>PRÓXIMOS 30 DIAS</mark></h1><p className="lead">Com base nas suas respostas, organizamos seu ponto de partida para conhecer o modelo e planejar seus próximos passos.</p><JourneyChart/><div className="target-cards"><div><span className="target-percent">10%</span><span className="target-bar"><i style={{height:'10%'}}/></span><small>{content.result.comparison.today}</small><strong>$0,00</strong></div><div><span className="target-percent">100%</span><span className="target-bar"><i style={{height:'100%'}}/></span><small>{content.result.comparison.future}</small><strong>$1.500 a $3.000</strong></div></div><dl className="personal-summary"><div><dt>O que move você</dt><dd>{suggestion.goal}</dd></div><div><dt>Seu sonho</dt><dd>{suggestion.dream}</dd></div><div><dt>A meta diária que você escolheu</dt><dd>{suggestion.dailyTarget}</dd></div><div><dt>Seu tempo para aplicar</dt><dd>{suggestion.time} por dia</dd></div></dl><img className="partner-banner-image" src={content.result.partnerBanner.src} srcSet={content.result.partnerBanner.srcSet} sizes="(max-width: 668px) calc(100vw - 48px), 620px" alt={content.result.partnerBanner.alt} width={1240} height={414} decoding="async" loading="lazy"/></>}
      {step===OFFER_STEP&&<><h1 className="offer-title" ref={headingRef} tabIndex={-1}>{content.offer.title.intro}{' '}<mark>{content.offer.title.highlight}</mark>{' '}{content.offer.title.unit}{' '}{content.offer.title.ending}</h1><p className="lead">{content.offer.description}</p><GatedVideo config={content.offer.video} title="Rota do Dólar com IA" cta={content.offer.cta} notice={content.offer.notice} busy={busy} onContinue={()=>void finalAction()} vertical/></>}
      {step===DECLINED_STEP&&<><h1 ref={headingRef} tabIndex={-1}>Você decide quando<br/><mark>dar o próximo passo.</mark></h1><p className="lead">Você escolheu não continuar com o questionário.</p></>}
      {error&&<div className="error" role="alert">{error}{!ready&&<Button variant="outline" onClick={()=>setRetry(n=>n+1)}>Tentar novamente</Button>}</div>}
    </section>
    {step===RESULT_STEP&&<div className="result-cta"><QuizCTA busy={busy} ready={ready} onClick={()=>void navigate(OFFER_STEP)}>{content.result.cta}</QuizCTA></div>}
  </main>;
}
