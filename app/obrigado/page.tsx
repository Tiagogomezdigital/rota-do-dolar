'use client';
import {GatedVideo} from '@/components/gated-video';
import {content} from '@/lib/content';
export default function Obrigado(){
  return <main className="thanks-page"><div className="thanks-container"><h1>{content.thanks.title}</h1><GatedVideo config={content.thanks.video} title="Sua aula de ativação" cta={content.thanks.cta} onContinue={()=>window.location.assign(content.thanks.destination)} vertical/><p className="thanks-footer">Rota do Dólar · Tiago Gomez</p></div></main>;
}
