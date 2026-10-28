import { redirect } from 'next/navigation';
import {isVercelAuthRuntime} from '@/lib/auth';
export default function AdminLink() { redirect(isVercelAuthRuntime()?'/admin':'https://jornada-quiz-doug.dougfrr1.chatgpt.site/admin'); }
