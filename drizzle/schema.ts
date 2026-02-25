import { sqliteTable, AnySQLiteColumn, text, integer, foreignKey, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const courses = sqliteTable("courses", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	level: text().notNull(),
	year: integer().notNull(),
	maxStudents: integer("max_students"),
	status: text().default("closed").notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`),
	enrollmentStartDate: integer("enrollment_start_date"),
	enrollmentEndDate: integer("enrollment_end_date"),
});

export const enrollments = sqliteTable("enrollments", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id),
	courseId: text("course_id").notNull().references(() => courses.id),
	fullName: text("full_name").notNull(),
	email: text().notNull(),
	age: integer().notNull(),
	schoolYear: text("school_year").notNull(),
	schoolName: text("school_name"),
	region: text(),
	commune: text(),
	previousExperience: text("previous_experience"),
	motivation: text(),
	status: text().default("pending").notNull(),
	adminNotes: text("admin_notes"),
	createdAt: integer("created_at").default(sql`(unixepoch())`),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`),
	feedback: text(),
	gender: text().notNull(),
	notifiedAt: integer("notified_at"),
	sectionId: text("section_id").references(() => sections.id),
});

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	discordId: text("discord_id").notNull(),
	discordUsername: text("discord_username").notNull(),
	discordAvatar: text("discord_avatar"),
	email: text(),
	role: text().default("student").notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`),
	name: text(),
},
(table) => [
	uniqueIndex("users_discord_id_unique").on(table.discordId),
]);

export const emailTemplates = sqliteTable("email_templates", {
	id: text().primaryKey().notNull(),
	subject: text().notNull(),
	body: text().notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`),
	signature: text().default("Sistema de Notificaciones").notNull(),
});

export const inviteCodes = sqliteTable("invite_codes", {
	code: text().primaryKey().notNull(),
	role: text().notNull(),
	createdBy: text("created_by").notNull().references(() => users.id),
	usedBy: text("used_by").references(() => users.id),
	createdAt: integer("created_at").default(sql`(unixepoch())`),
	usedAt: integer("used_at"),
});

export const settings = sqliteTable("settings", {
	key: text().primaryKey().notNull(),
	value: text().notNull(),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const attendance = sqliteTable("attendance", {
	id: text().primaryKey().notNull(),
	moduleId: text("module_id").notNull().references(() => modules.id),
	studentId: text("student_id").notNull().references(() => users.id),
	sectionId: text("section_id").notNull().references(() => sections.id),
	status: text().default("present").notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const moduleMaterials = sqliteTable("module_materials", {
	id: text().primaryKey().notNull(),
	moduleId: text("module_id").notNull().references(() => modules.id),
	title: text().notNull(),
	url: text().notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`),
});

export const modules = sqliteTable("modules", {
	id: text().primaryKey().notNull(),
	courseId: text("course_id").notNull().references(() => courses.id),
	title: text().notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const sections = sqliteTable("sections", {
	id: text().primaryKey().notNull(),
	courseId: text("course_id").notNull().references(() => courses.id),
	name: text().notNull(),
	teacherId: text("teacher_id").notNull().references(() => users.id),
	createdAt: integer("created_at").default(sql`(unixepoch())`),
	updatedAt: integer("updated_at").default(sql`(unixepoch())`),
});

export const studentObservations = sqliteTable("student_observations", {
	id: text().primaryKey().notNull(),
	studentId: text("student_id").notNull().references(() => users.id),
	teacherId: text("teacher_id").notNull().references(() => users.id),
	courseId: text("course_id").notNull().references(() => courses.id),
	observation: text().notNull(),
	createdAt: integer("created_at").default(sql`(unixepoch())`),
});

