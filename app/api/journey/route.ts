import {createJourneyHandlers} from '@/lib/journey-handlers';
import {originalQuiz} from '@/lib/quizzes/original';

export const dynamic='force-dynamic';
const handlers=createJourneyHandlers(originalQuiz);
export const GET=handlers.GET;
export const POST=handlers.POST;
