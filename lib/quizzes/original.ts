import * as edition from '../content';
import type {QuizDefinition} from '../quiz-definition';

export const originalQuiz:QuizDefinition = {
  id:'tiago',label:'Tiago',path:'/',apiPath:'/tiago-gomes/api/journey',
  cookieName:'journey_session',cookiePath:'/',
  contentVersion:edition.CONTENT_VERSION,content:edition.content,questions:edition.questions,
  getSuggestion:edition.getSuggestion,processDurationMs:edition.PROCESS_DURATION_MS,
  processStep:edition.PROCESS_STEP,storyStep:edition.STORY_STEP,resultStep:edition.RESULT_STEP,
  offerStep:edition.OFFER_STEP,declinedStep:edition.DECLINED_STEP,stepNames:edition.stepNames,
};
