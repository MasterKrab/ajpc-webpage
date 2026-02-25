import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'
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

export const sections = sqliteTable('sections', {
  id: text('id').primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const sectionDocentes = sqliteTable(
  'section_docentes',
  {
    sectionId: text('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    teacherId: text('teacher_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.sectionId, table.teacherId] }),
    }
  },
)

export const enrollments = sqliteTable('enrollments', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id),
  sectionId: text('section_id').references(() => sections.id),
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

export const studentObservations = sqliteTable('student_observations', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => users.id),
  teacherId: text('teacher_id')
    .notNull()
    .references(() => users.id),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id),
  observation: text('observation').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const modules = sqliteTable('modules', {
  id: text('id').primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id),
  title: text('title').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const moduleMaterials = sqliteTable('module_materials', {
  id: text('id').primaryKey(),
  moduleId: text('module_id')
    .notNull()
    .references(() => modules.id),
  title: text('title').notNull(),
  url: text('url').notNull(),
  type: text('type').notNull().default('link'), // 'link', 'document', 'video', etc.
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export const attendance = sqliteTable('attendance', {
  id: text('id').primaryKey(),
  moduleId: text('module_id')
    .notNull()
    .references(() => modules.id),
  studentId: text('student_id')
    .notNull()
    .references(() => users.id),
  sectionId: text('section_id')
    .notNull()
    .references(() => sections.id),
  status: text('status', { enum: ['present', 'absent', 'late', 'excused'] })
    .default('present')
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
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
  maxUses: integer('max_uses').default(1),
  uses: integer('uses').default(0),
})

export const inviteUsages = sqliteTable('invite_usages', {
  id: text('id').primaryKey(),
  inviteCode: text('invite_code')
    .notNull()
    .references(() => inviteCodes.code, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  usedAt: integer('used_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert
export type Section = typeof sections.$inferSelect
export type NewSection = typeof sections.$inferInsert
export type Enrollment = typeof enrollments.$inferSelect
export type NewEnrollment = typeof enrollments.$inferInsert
export type EmailTemplate = typeof emailTemplates.$inferSelect
export type NewEmailTemplate = typeof emailTemplates.$inferInsert
export type StudentObservation = typeof studentObservations.$inferSelect
export type NewStudentObservation = typeof studentObservations.$inferInsert
export type Module = typeof modules.$inferSelect
export type NewModule = typeof modules.$inferInsert
export type ModuleMaterial = typeof moduleMaterials.$inferSelect
export type NewModuleMaterial = typeof moduleMaterials.$inferInsert
export type Attendance = typeof attendance.$inferSelect
export type NewAttendance = typeof attendance.$inferInsert
export type SectionDocente = typeof sectionDocentes.$inferSelect
export type NewSectionDocente = typeof sectionDocentes.$inferInsert
export type InviteCode = typeof inviteCodes.$inferSelect
export type NewInviteCode = typeof inviteCodes.$inferInsert
export type InviteUsage = typeof inviteUsages.$inferSelect
export type NewInviteUsage = typeof inviteUsages.$inferInsert
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON string or simple value
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(
    sql`(unixepoch())`,
  ),
})

export type Setting = typeof settings.$inferSelect
export type NewSetting = typeof settings.$inferInsert
