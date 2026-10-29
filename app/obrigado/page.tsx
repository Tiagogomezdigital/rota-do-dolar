import {ThanksPage} from '@/components/thanks-page';
import {content} from '@/lib/content';

export default function Obrigado(){
  return <ThanksPage key="thanks" config={content.thanks} offerId="thanks-pitch-offer"/>;
}
