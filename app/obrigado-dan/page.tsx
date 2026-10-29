import {ThanksPage} from '@/components/thanks-page';
import {content} from '@/lib/content';

export default function ObrigadoDan(){
  return <ThanksPage key="thanks-dan" config={content.thanksDan} offerId="thanks-dan-pitch-offer"/>;
}
