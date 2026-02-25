import { relations } from "drizzle-orm/relations";
import { courses, enrollments, users, sections, inviteCodes, attendance, modules, moduleMaterials, studentObservations } from "./schema";

export const enrollmentsRelations = relations(enrollments, ({one}) => ({
	course: one(courses, {
		fields: [enrollments.courseId],
		references: [courses.id]
	}),
	user: one(users, {
		fields: [enrollments.userId],
		references: [users.id]
	}),
	section: one(sections, {
		fields: [enrollments.sectionId],
		references: [sections.id]
	}),
}));

export const coursesRelations = relations(courses, ({many}) => ({
	enrollments: many(enrollments),
	modules: many(modules),
	sections: many(sections),
	studentObservations: many(studentObservations),
}));

export const usersRelations = relations(users, ({many}) => ({
	enrollments: many(enrollments),
	inviteCodes_usedBy: many(inviteCodes, {
		relationName: "inviteCodes_usedBy_users_id"
	}),
	inviteCodes_createdBy: many(inviteCodes, {
		relationName: "inviteCodes_createdBy_users_id"
	}),
	attendances: many(attendance),
	sections: many(sections),
	studentObservations_teacherId: many(studentObservations, {
		relationName: "studentObservations_teacherId_users_id"
	}),
	studentObservations_studentId: many(studentObservations, {
		relationName: "studentObservations_studentId_users_id"
	}),
}));

export const sectionsRelations = relations(sections, ({one, many}) => ({
	enrollments: many(enrollments),
	attendances: many(attendance),
	user: one(users, {
		fields: [sections.teacherId],
		references: [users.id]
	}),
	course: one(courses, {
		fields: [sections.courseId],
		references: [courses.id]
	}),
}));

export const inviteCodesRelations = relations(inviteCodes, ({one}) => ({
	user_usedBy: one(users, {
		fields: [inviteCodes.usedBy],
		references: [users.id],
		relationName: "inviteCodes_usedBy_users_id"
	}),
	user_createdBy: one(users, {
		fields: [inviteCodes.createdBy],
		references: [users.id],
		relationName: "inviteCodes_createdBy_users_id"
	}),
}));

export const attendanceRelations = relations(attendance, ({one}) => ({
	section: one(sections, {
		fields: [attendance.sectionId],
		references: [sections.id]
	}),
	user: one(users, {
		fields: [attendance.studentId],
		references: [users.id]
	}),
	module: one(modules, {
		fields: [attendance.moduleId],
		references: [modules.id]
	}),
}));

export const modulesRelations = relations(modules, ({one, many}) => ({
	attendances: many(attendance),
	moduleMaterials: many(moduleMaterials),
	course: one(courses, {
		fields: [modules.courseId],
		references: [courses.id]
	}),
}));

export const moduleMaterialsRelations = relations(moduleMaterials, ({one}) => ({
	module: one(modules, {
		fields: [moduleMaterials.moduleId],
		references: [modules.id]
	}),
}));

export const studentObservationsRelations = relations(studentObservations, ({one}) => ({
	course: one(courses, {
		fields: [studentObservations.courseId],
		references: [courses.id]
	}),
	user_teacherId: one(users, {
		fields: [studentObservations.teacherId],
		references: [users.id],
		relationName: "studentObservations_teacherId_users_id"
	}),
	user_studentId: one(users, {
		fields: [studentObservations.studentId],
		references: [users.id],
		relationName: "studentObservations_studentId_users_id"
	}),
}));