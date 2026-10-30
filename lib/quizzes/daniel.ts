import * as edition from '../content-daniel';
import type {QuizDefinition} from '../quiz-definition';

export const danielQuiz:QuizDefinition = {
  id:'daniel',label:'Daniel',path:'/daniel',apiPath:'/daniel/api/journey',
  cookieName:'journey_session_daniel',cookiePath:'/daniel',
  contentVersion:edition.CONTENT_VERSION,content:edition.content,questions:edition.questions,
  getSuggestion:edition.getSuggestion,processDurationMs:edition.PROCESS_DURATION_MS,
  processStep:edition.PROCESS_STEP,storyStep:edition.STORY_STEP,resultStep:edition.RESULT_STEP,
  offerStep:edition.OFFER_STEP,declinedStep:edition.DECLINED_STEP,stepNames:edition.stepNames,
};
