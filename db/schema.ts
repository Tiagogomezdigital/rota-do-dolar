import {sqliteTable,text,integer,index,primaryKey} from 'drizzle-orm/sqlite-core';
export const sessions = sqliteTable('sessions', {
  id:text('id').primaryKey(), contentVersion:text('content_version').notNull(),
  createdAt:integer('created_at').notNull(), startedAt:integer('started_at'), lastSeen:integer('last_seen').notNull(),
  currentStep:integer('current_step').notNull().default(0), furthestStep:integer('furthest_step').notNull().default(0),
  completedAt:integer('completed_at'), ctaClickedAt:integer('cta_clicked_at'),
  source:text('source').notNull().default('direto'), device:text('device').notNull().default('desktop'),
},t=>[index('idx_sessions_created_at').on(t.createdAt),index('idx_sessions_last_seen').on(t.lastSeen)]);
export const answers = sqliteTable('answers', {
  sessionId:text('session_id').notNull().references(()=>sessions.id,{onDelete:'cascade'}),
  questionId:text('question_id').notNull(),optionId:text('option_id').notNull(),answeredAt:integer('answered_at').notNull(),
},t=>[primaryKey({columns:[t.sessionId,t.questionId]})]);
export const views = sqliteTable('step_views',{
  sessionId:text('session_id').notNull().references(()=>sessions.id,{onDelete:'cascade'}),step:integer('step').notNull(),firstSeen:integer('first_seen').notNull(),
},t=>[primaryKey({columns:[t.sessionId,t.step]})]);
