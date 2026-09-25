import {env} from 'cloudflare:workers';
export function database(): D1Database { if(!env.DB) throw new Error('DB unavailable'); return env.DB; }
export function adminEmails(): string[] { return (env.ADMIN_EMAILS ?? '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean); }
