import { z } from 'zod'
import { router, publicProcedure, adminProcedure } from '../trpc'
import {
  courses,
  enrollments,
  users,
  codeforcesContests,
  codeforcesSubmissions,
} from '@db/schema'
import { eq, and, notInArray, sql, desc } from 'drizzle-orm'
import {
  codeforcesRequest,
  type CodeforcesContest,
  type CodeforcesSubmission,
} from '@lib/codeforces'
import { TRPCError } from '@trpc/server'

const FAILED_VERDICTS = [
  'WRONG_ANSWER',
  'RUNTIME_ERROR',
  'TIME_LIMIT_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
  'REJECTED',
]

const RANKING_SYNC_CACHE_MINUTES = 10

/**
 * Calculates the ranking for a given course.
 */
const calculateRanking = async (database: any, courseId: string) => {
  // Get all enrolled users with a linked Codeforces account
  const enrolledUsers = await database
    .select({
      id: users.id,
      name: users.name,
      handle: users.codeforcesHandle,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .where(
      and(
        eq(enrollments.courseId, courseId),
        sql`${users.codeforcesHandle} IS NOT NULL`,
      ),
    )

  if (enrolledUsers.length === 0) return []

  // Get all submissions for contests that count for global ranking in this course
  const submissions = await database
    .select({
      userId: codeforcesSubmissions.userId,
      contestId: codeforcesSubmissions.contestId,
      problemId: codeforcesSubmissions.problemId,
      points: codeforcesSubmissions.points,
      verdict: codeforcesSubmissions.verdict,
      creationTimeSeconds: codeforcesSubmissions.creationTimeSeconds,
      contestStartTime: codeforcesContests.startTimeSeconds,
    })
    .from(codeforcesSubmissions)
    .innerJoin(
      codeforcesContests,
      eq(codeforcesSubmissions.contestId, codeforcesContests.id),
    )
    .where(
      and(
        eq(codeforcesContests.courseId, courseId),
        eq(codeforcesContests.countedForGlobal, true),
      ),
    )

  const rankingMap = new Map()
  enrolledUsers.forEach((user: any) => {
    rankingMap.set(user.id, {
      userId: user.id,
      name: user.name,
      handle: user.handle,
      totalPoints: 0,
      totalPenaltySeconds: 0,
      totalWrongAttempts: 0,
    })
  })

  const userProblemBestMap = new Map()
  submissions.forEach((submission: any) => {
    const { userId, contestId, problemId, points, creationTimeSeconds } =
      submission

    const key = `${userId}-${contestId}-${problemId}`
    const currentBest = userProblemBestMap.get(key)

    if (
      !currentBest ||
      points > currentBest.points ||
      (points === currentBest.points &&
        creationTimeSeconds < currentBest.creationTimeSeconds)
    ) {
      userProblemBestMap.set(key, submission)
    }
  })

  submissions.forEach((submission: any) => {
    const { userId, contestId, problemId, creationTimeSeconds, verdict } =
      submission

    const key = `${userId}-${contestId}-${problemId}`
    const bestSubmission = userProblemBestMap.get(key)

    const userRank = rankingMap.get(userId)

    if (
      userRank &&
      bestSubmission &&
      creationTimeSeconds < bestSubmission.creationTimeSeconds &&
      bestSubmission.points > 0
    ) {
      if (FAILED_VERDICTS.includes(verdict)) {
        userRank.totalWrongAttempts++
      }
    }
  })

  userProblemBestMap.forEach((submission: any) => {
    const { userId, points, contestStartTime, creationTimeSeconds } = submission

    const userRank = rankingMap.get(userId)

    if (!userRank) return

    userRank.totalPoints += points

    if (points > 0 && contestStartTime) {
      userRank.totalPenaltySeconds += Math.max(
        0,
        creationTimeSeconds - contestStartTime,
      )
    }
  })

  return Array.from(rankingMap.values()).sort((first, second) => {
    if (second.totalPoints !== first.totalPoints) {
      return second.totalPoints - first.totalPoints
    }

    if (first.totalPenaltySeconds !== second.totalPenaltySeconds) {
      return first.totalPenaltySeconds - second.totalPenaltySeconds
    }

    return first.totalWrongAttempts - second.totalWrongAttempts
  })
}

/**
 * Syncs submissions from Codeforces for a given course.
 */
const syncCourseSubmissions = async (database: any, course: any) => {
  const courseId = course.id
  const contests = await database
    .select()
    .from(codeforcesContests)
    .where(
      and(
        eq(codeforcesContests.courseId, courseId),
        eq(codeforcesContests.countedForGlobal, true),
      ),
    )

  if (contests.length === 0) return

  const enrolledUsers = await database
    .select({ id: users.id, handle: users.codeforcesHandle })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .where(eq(enrollments.courseId, courseId))

  const handleToUserIdMap = new Map<string, string>()
  enrolledUsers.forEach((user: any) => {
    if (user.handle) {
      handleToUserIdMap.set(user.handle.trim().toLowerCase(), user.id)
    }
  })

  if (handleToUserIdMap.size === 0) return

  for (const contest of contests) {
    const submissions: CodeforcesSubmission[] = await codeforcesRequest(
      'contest.status',
      {
        contestId: contest.id,
        groupCode: course.codeforcesGroupId || '',
        asGym: 'true',
        count: 10000,
      },
    )

    const submissionsToSync = []
    for (const submission of submissions) {
      for (const member of submission.author.members) {
        const codeforcesHandle = member.handle.trim().toLowerCase()
        if (handleToUserIdMap.has(codeforcesHandle)) {
          submissionsToSync.push({
            submission,
            userId: handleToUserIdMap.get(codeforcesHandle)!,
          })
          break
        }
      }
    }

    for (const item of submissionsToSync) {
      const { submission, userId } = item
      let points = submission.points || 0
      if (contest.type === 'ICPC' && submission.verdict === 'OK') {
        points = 100
      }

      await database
        .insert(codeforcesSubmissions)
        .values({
          id: submission.id.toString(),
          contestId: contest.id,
          userId,
          problemId: submission.problem.index,
          verdict: submission.verdict || 'UNKNOWN',
          passedTestCount: submission.passedTestCount,
          timeConsumedMillis: submission.timeConsumedMillis,
          creationTimeSeconds: submission.creationTimeSeconds,
          points,
        })
        .onConflictDoUpdate({
          target: codeforcesSubmissions.id,
          set: {
            userId,
            verdict: submission.verdict || 'UNKNOWN',
            passedTestCount: submission.passedTestCount,
            timeConsumedMillis: submission.timeConsumedMillis,
            points,
            updatedAt: new Date(),
          },
        })
    }

    await database
      .update(codeforcesContests)
      .set({ lastSync: new Date() })
      .where(eq(codeforcesContests.id, contest.id))
  }

  await database
    .update(courses)
    .set({ codeforcesLastRankingSync: new Date() })
    .where(eq(courses.id, courseId))
}

export const codeforcesRouter = router({
  getRanking: publicProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { courseId } = input
      const user = ctx.user

      // Access check
      if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })
      if (user.role !== 'admin' && user.role !== 'sudo') {
        const [enrollment] = await ctx.database
          .select()
          .from(enrollments)
          .where(
            and(
              eq(enrollments.courseId, courseId),
              eq(enrollments.userId, user.id),
            ),
          )
        if (!enrollment) throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const [course] = await ctx.database
        .select()
        .from(courses)
        .where(eq(courses.id, courseId))
      if (!course) throw new TRPCError({ code: 'NOT_FOUND' })

      // Auto-sync logic
      const cacheThreshold = new Date(
        Date.now() - RANKING_SYNC_CACHE_MINUTES * 60 * 1000,
      )

      if (
        !course.codeforcesLastRankingSync ||
        course.codeforcesLastRankingSync < cacheThreshold
      ) {
        try {
          await syncCourseSubmissions(ctx.database, course)
        } catch (error) {
          console.error('Auto-sync failed:', error)
          // Continue to return old data if sync fails
        }
      }

      return calculateRanking(ctx.database, courseId)
    }),

  syncRankingManual: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [course] = await ctx.database
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
      if (!course) throw new TRPCError({ code: 'NOT_FOUND' })

      await syncCourseSubmissions(ctx.database, course)
      return { success: true }
    }),

  getContests: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.database
        .select()
        .from(codeforcesContests)
        .where(eq(codeforcesContests.courseId, input.courseId))
    }),

  syncContests: adminProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [course] = await ctx.database
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId))
      if (!course || !course.codeforcesGroupId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'ID de grupo no configurado',
        })
      }

      const contests: CodeforcesContest[] = await codeforcesRequest(
        'contest.list',
        {
          gym: 'true',
          groupCode: course.codeforcesGroupId,
        },
      )

      const fetchedContestIds = contests.map((contest) => contest.id.toString())

      // Clean up removed contests
      if (fetchedContestIds.length > 0) {
        await ctx.database
          .delete(codeforcesContests)
          .where(
            and(
              eq(codeforcesContests.courseId, input.courseId),
              notInArray(codeforcesContests.id, fetchedContestIds),
            ),
          )
      } else {
        await ctx.database
          .delete(codeforcesContests)
          .where(eq(codeforcesContests.courseId, input.courseId))
      }

      for (const contest of contests) {
        await ctx.database
          .insert(codeforcesContests)
          .values({
            id: contest.id.toString(),
            courseId: input.courseId,
            name: contest.name,
            type: contest.type,
            startTimeSeconds: contest.startTimeSeconds || null,
            durationSeconds: contest.durationSeconds || null,
            countedForGlobal: false,
          })
          .onConflictDoUpdate({
            target: codeforcesContests.id,
            set: {
              courseId: input.courseId,
              name: contest.name,
              type: contest.type,
              startTimeSeconds: contest.startTimeSeconds || null,
              durationSeconds: contest.durationSeconds || null,
              updatedAt: new Date(),
            },
          })
      }

      return ctx.database
        .select()
        .from(codeforcesContests)
        .where(eq(codeforcesContests.courseId, input.courseId))
    }),

  toggleContest: adminProcedure
    .input(
      z.object({
        courseId: z.string(),
        contestId: z.string(),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.database
        .update(codeforcesContests)
        .set({
          countedForGlobal: input.enabled,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(codeforcesContests.id, input.contestId),
            eq(codeforcesContests.courseId, input.courseId),
          ),
        )
      return { success: true }
    }),

  unlinkAccount: publicProcedure.mutation(async ({ ctx }) => {
    const user = ctx.user
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })

    // Delete stored submissions to avoid "ghost" points if they link another account
    await ctx.database
      .delete(codeforcesSubmissions)
      .where(eq(codeforcesSubmissions.userId, user.id))

    await ctx.database
      .update(users)
      .set({
        codeforcesHandle: null,
        codeforcesRating: null,
        codeforcesLastSync: null,
      })
      .where(eq(users.id, user.id))

    return { success: true }
  }),
})
