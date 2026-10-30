'use client';
import {QuizExperience} from '@/components/quiz-experience';
import {danielQuiz} from '@/lib/quizzes/daniel';

export default function Home(){
  return <QuizExperience key={danielQuiz.id} quiz={danielQuiz}/>;
}
