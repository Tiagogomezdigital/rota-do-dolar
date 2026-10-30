import {originalQuiz} from './original';
import {danielQuiz} from './daniel';

// Public entrypoints import their individual config to avoid downloading both editions.
export const quizzes = [originalQuiz,danielQuiz] as const;
export const defaultQuiz = originalQuiz;
export function getQuiz(id:string|null){return quizzes.find(quiz=>quiz.id===id);}
