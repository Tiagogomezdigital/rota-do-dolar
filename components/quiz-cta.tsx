import type {ReactNode} from 'react';
import {Button} from './quiz-controls';
import {QuizIllustration} from './quiz-illustration';

export function QuizCTA({children,busy,ready,onClick}:{children:ReactNode;busy:boolean;ready:boolean;onClick:()=>void}){
  return <Button className="cta" disabled={busy||!ready} onClick={onClick}>{busy&&<QuizIllustration name="loading"/>}{children}</Button>;
}
