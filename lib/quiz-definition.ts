import type {content,questions,getSuggestion} from './content';

/** A route owns its content edition and session; visitors cannot select them in a request body. */
export type QuizDefinition = {
  id:'tiago'|'daniel';
  label:string;
  path:string;
  apiPath:string;
  cookieName:string;
  cookiePath:string;
  contentVersion:string;
  content:Omit<typeof content,'thanks'|'thanksDan'>;
  questions:typeof questions;
  getSuggestion:typeof getSuggestion;
  processDurationMs:number;
  processStep:number;
  storyStep:number;
  resultStep:number;
  offerStep:number;
  declinedStep:number;
  stepNames:string[];
};
