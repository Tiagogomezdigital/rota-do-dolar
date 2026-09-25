import {getChatGPTUser} from '@/app/chatgpt-auth';
import {adminEmails} from './database';
export async function adminAccess(){const user=await getChatGPTUser();return {user,allowed:!!user&&adminEmails().includes(user.email.toLowerCase())};}
export const privateHeaders = {'Cache-Control':'private, no-store','Vary':'Cookie, oai-authenticated-user-id','X-Content-Type-Options':'nosniff'};
