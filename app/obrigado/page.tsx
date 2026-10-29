'use client';
import {GatedVideo} from '@/components/gated-video';
import {content} from '@/lib/content';
import styles from './page.module.css';
export default function Obrigado(){
  const configured=!!content.thanks.video.src||!!content.thanks.video.embedUrl||!!content.thanks.video.vturb;
  return <main className={styles.page}>
    <div className={styles.container}>
      <h1 className={styles.headline}>{content.thanks.title}</h1>
      <section className={styles.watch} aria-label="Aula exclusiva">
        {configured?<GatedVideo config={content.thanks.video} title="Sua aula de ativação" cta={content.thanks.cta} onContinue={()=>window.location.assign(content.thanks.destination)} vertical/>:<>
          <div className={styles.placeholder} role="img" aria-label="Espaço reservado para o vídeo da aula">
            <span className={styles.eyebrow}>AULA EXCLUSIVA</span>
            <span className={styles.play} aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.4c0-.8.9-1.3 1.6-.9l10 6.6c.6.4.6 1.3 0 1.8l-10 6.6c-.7.4-1.6-.1-1.6-.9V5.4Z"/></svg></span>
            <strong className={styles.placeholderTitle}>Sua aula entra aqui.</strong>
            <span className={styles.caption}>Espaço reservado para a VSL</span>
            <span className={styles.progress} aria-hidden="true"/>
          </div>
          {content.thanks.showButtonImmediately&&<a className={styles.cta} href={content.thanks.destination}>
            <span>{content.thanks.cta}</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>}
        </>}
      </section>
    </div>
  </main>;
}
