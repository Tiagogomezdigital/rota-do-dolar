import {index,integer,sqliteTable,text,uniqueIndex} from 'drizzle-orm/sqlite-core';

const date=(name:string)=>integer(name,{mode:'timestamp_ms'});
const createdAt=()=>date('created_at').notNull().$defaultFn(()=>new Date());
const updatedAt=()=>date('updated_at').notNull().$defaultFn(()=>new Date()).$onUpdate(()=>new Date());

// Authentication records are separate from the anonymous quiz sessions.
export const user=sqliteTable('auth_user',{
  id:text('id').primaryKey(),
  name:text('name').notNull(),
  email:text('email').notNull().unique(),
  emailVerified:integer('email_verified',{mode:'boolean'}).notNull().default(false),
  image:text('image'),
  createdAt:createdAt(),
  updatedAt:updatedAt(),
});

export const session=sqliteTable('auth_session',{
  id:text('id').primaryKey(),
  expiresAt:date('expires_at').notNull(),
  token:text('token').notNull().unique(),
  createdAt:createdAt(),
  updatedAt:updatedAt(),
  ipAddress:text('ip_address'),
  userAgent:text('user_agent'),
  userId:text('user_id').notNull().references(()=>user.id,{onDelete:'cascade'}),
},t=>[index('auth_session_user_idx').on(t.userId)]);

export const account=sqliteTable('auth_account',{
  id:text('id').primaryKey(),
  accountId:text('account_id').notNull(),
  providerId:text('provider_id').notNull(),
  userId:text('user_id').notNull().references(()=>user.id,{onDelete:'cascade'}),
  accessToken:text('access_token'),
  refreshToken:text('refresh_token'),
  idToken:text('id_token'),
  accessTokenExpiresAt:date('access_token_expires_at'),
  refreshTokenExpiresAt:date('refresh_token_expires_at'),
  scope:text('scope'),
  password:text('password'),
  createdAt:createdAt(),
  updatedAt:updatedAt(),
},t=>[
  index('auth_account_user_idx').on(t.userId),
  uniqueIndex('auth_account_provider_subject_idx').on(t.providerId,t.accountId),
]);

export const verification=sqliteTable('auth_verification',{
  id:text('id').primaryKey(),
  identifier:text('identifier').notNull(),
  value:text('value').notNull(),
  expiresAt:date('expires_at').notNull(),
  createdAt:createdAt(),
  updatedAt:updatedAt(),
},t=>[index('auth_verification_identifier_idx').on(t.identifier)]);
