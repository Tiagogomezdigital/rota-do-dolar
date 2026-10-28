import {getChatGPTUser} from '@/app/chatgpt-auth';
import {adminEmails} from './database';
import {isVercelAuthRuntime} from './auth';
export async function adminAccess(){const user=await getChatGPTUser();return {user,allowed:!!user&&adminEmails().includes(user.email.toLowerCase())};}
export const privateHeaders = {'Cache-Control':'private, no-store','Vary':isVercelAuthRuntime()?'Cookie':'Cookie, oai-authenticated-user-id','X-Content-Type-Options':'nosniff'};
