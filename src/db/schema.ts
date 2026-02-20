import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  discordId: text('discord_id').unique().notNull(),
  discordUsername: text('discord_username').notNull(),
  discordAvatar: text('discord_avatar'),
  name: text('name'), // System display name
  email: text('email'),
  role: text('role', { enum: ['student', 'docente', 'admin', 'sudo'] })
    .default('student')
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const courses = sqliteTable('courses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  level: text('level', {
    enum: ['beginner', 'intermediate', 'advanced'],
  }).notNull(),
  year: integer('year').notNull(),
  maxStudents: integer('max_students'),
  enrollmentStartDate: integer('enrollment_start_date', { mode: 'timestamp' }),
  enrollmentEndDate: integer('enrollment_end_date', { mode: 'timestamp' }),
  status: text('status', { enum: ['open', 'closed'] })
    .default('closed')
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const enrollments = sqliteTable('enrollments', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  age: integer('age').notNull(),
  gender: text('gender').notNull(),
  schoolYear: text('school_year').notNull(),
  schoolName: text('school_name'),
  region: text('region'),
  commune: text('commune'),
  previousExperience: text('previous_experience'),
  motivation: text('motivation'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .default('pending')
    .notNull(),
  adminNotes: text('admin_notes'),
  feedback: text('feedback'),
  notifiedAt: integer('notified_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const emailTemplates = sqliteTable('email_templates', {
  id: text('id').primaryKey(), // 'approved', 'rejected'
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  signature: text('signature').notNull().default('Sistema de Notificaciones'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const inviteCodes = sqliteTable('invite_codes', {
  code: text('code').primaryKey(),
  role: text('role', { enum: ['student', 'docente', 'admin'] }).notNull(),
  createdBy: text('created_by')
    .notNull()
    .references(() => users.id),
  usedBy: text('used_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  usedAt: integer('used_at', { mode: 'timestamp' }),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert
export type Enrollment = typeof enrollments.$inferSelect
export type NewEnrollment = typeof enrollments.$inferInsert
export type EmailTemplate = typeof emailTemplates.$inferSelect
export type NewEmailTemplate = typeof emailTemplates.$inferInsert
export type InviteCode = typeof inviteCodes.$inferSelect
export type NewInviteCode = typeof inviteCodes.$inferInsert

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON string or simple value
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export type Setting = typeof settings.$inferSelect
export type NewSetting = typeof settings.$inferInsert
