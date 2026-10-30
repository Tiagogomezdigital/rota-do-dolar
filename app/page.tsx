'use client';
import {QuizExperience} from '@/components/quiz-experience';
import {originalQuiz} from '@/lib/quizzes/original';

export default function Home(){
  return <QuizExperience key={originalQuiz.id} quiz={originalQuiz}/>;
}
