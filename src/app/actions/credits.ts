'use server'

import { prisma } from '@/lib/prisma'

export async function confirmFill(surveyId: string, fillerId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch survey details
      const survey = await tx.survey.findUnique({
        where: { id: surveyId },
        select: { owner_id: true, status: true, target_responses: true, current_responses: true }
      })

      if (!survey) return { error: 'Survey not found' }
      if (survey.owner_id === fillerId) return { error: 'Cannot fill your own survey' }
      if (survey.status !== 'ACTIVE') return { error: 'This survey just got paused, try another one!' }

      // 2. Check for duplicate fill
      const existingFill = await tx.fillEvent.findUnique({
        where: { survey_id_filler_id: { survey_id: surveyId, filler_id: fillerId } }
      })
      if (existingFill) return { error: 'You have already filled this survey' }

      // 3. Lock the owner's row to prevent concurrent race conditions on their credit balance
      // We use raw SQL to acquire a row-level lock (FOR UPDATE).
      const owners: any[] = await tx.$queryRaw`SELECT * FROM "User" WHERE id = ${survey.owner_id} FOR UPDATE`
      if (!owners || owners.length === 0) return { error: 'Survey owner not found' }
      
      const owner = owners[0]

      if (owner.credit_balance <= 0) {
        // If they have no credits left, ensure survey is paused and reject the fill.
        await tx.survey.update({
          where: { id: surveyId },
          data: { status: 'PAUSED' }
        })
        return { error: 'This survey just ran out of credits and got paused, try another one!' }
      }

      // 4. Update owner credits
      const updatedOwner = await tx.user.update({
        where: { id: survey.owner_id },
        data: { credit_balance: { decrement: 1 } }
      })

      // 5. Update filler credits and forms filled
      const updatedFiller = await tx.user.update({
        where: { id: fillerId },
        data: {
          credit_balance: { increment: 1 },
          total_forms_filled: { increment: 1 }
        }
      })

      // 6. Survey state transitions
      const newCurrentResponses = survey.current_responses + 1
      const isCompleted = newCurrentResponses >= survey.target_responses
      const newStatus = isCompleted ? 'COMPLETED' : (updatedOwner.credit_balance === 0 ? 'PAUSED' : 'ACTIVE')

      await tx.survey.update({
        where: { id: surveyId },
        data: {
          current_responses: newCurrentResponses,
          status: newStatus
        }
      })

      // 7. Audit records
      await tx.fillEvent.create({
        data: { survey_id: surveyId, filler_id: fillerId }
      })

      await tx.creditTransaction.create({
        data: { user_id: survey.owner_id, delta: -1, reason: 'SPENT_ON_FILL', related_survey_id: surveyId }
      })

      await tx.creditTransaction.create({
        data: { user_id: fillerId, delta: 1, reason: 'EARNED_FILL', related_survey_id: surveyId }
      })

      // 8. Auto-reactivate paused surveys for the filler if they just earned their first credit
      if (updatedFiller.credit_balance > 0) {
        await tx.survey.updateMany({
          where: { owner_id: fillerId, status: 'PAUSED' },
          data: { status: 'ACTIVE' }
        })
      }

      return { success: true }
    })
  } catch (error) {
    console.error('confirmFill error:', error)
    return { error: 'An unexpected error occurred while confirming the fill' }
  }
}
