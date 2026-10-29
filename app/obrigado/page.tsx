'use client';
import {useCallback,useEffect,useState} from 'react';
import {VturbPlayer} from '@/components/vturb-player';
import {warmVturbResources} from '@/components/vturb-resources';
import {content} from '@/lib/content';
import {registerVturbPitch} from '@/lib/vturb-pitch';
import styles from './page.module.css';
export default function Obrigado(){
  const configThanks=content.thanks.video.vturb;
  useEffect(()=>{warmVturbResources(configThanks);},[configThanks]);
  const [failed,setFailed]=useState(false);
  const playerFailed=useCallback(()=>setFailed(true),[]);
  const playerReady=useCallback((player:unknown)=>{
    registerVturbPitch(player,content.thanks.video.revealAtSeconds,'#thanks-pitch-offer');
  },[]);
  return <main className={styles.page}>
    <div className={styles.container}>
      <h1 className={styles.headline}>{content.thanks.title}</h1>
      <section className={styles.watch} aria-label="Aula exclusiva">
        {content.thanks.video.vturb?<div className={styles.video}>
          <VturbPlayer config={content.thanks.video.vturb} title="Sua aula de ativação" onError={playerFailed} onReady={playerReady}/>
        </div>:<>
          <div className={styles.placeholder} role="img" aria-label="Espaço reservado para o vídeo da aula">
            <span className={styles.eyebrow}>AULA EXCLUSIVA</span>
            <span className={styles.play} aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.4c0-.8.9-1.3 1.6-.9l10 6.6c.6.4.6 1.3 0 1.8l-10 6.6c-.7.4-1.6-.1-1.6-.9V5.4Z"/></svg></span>
            <strong className={styles.placeholderTitle}>Sua aula entra aqui.</strong>
            <span className={styles.caption}>Espaço reservado para a VSL</span>
            <span className={styles.progress} aria-hidden="true"/>
          </div>
        </>}
        {failed?<p role="alert">Não foi possível carregar a aula. Recarregue a página para tentar novamente.</p>:<div className={styles.pitchOffer} id="thanks-pitch-offer">
          <a className={styles.cta} href={content.thanks.destination}>
            <span>{content.thanks.cta}</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>}
      </section>
    </div>
  </main>;
}
