import {createJourneyHandlers} from '@/lib/journey-handlers';
import {danielQuiz} from '@/lib/quizzes/daniel';

export const dynamic='force-dynamic';
const handlers=createJourneyHandlers(danielQuiz);
export const GET=handlers.GET;
export const POST=handlers.POST;
