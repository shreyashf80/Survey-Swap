'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const surveySchema = z.object({
  google_form_url: z.string().url().includes('docs.google.com/forms', { message: 'Must be a valid Google Forms URL' }),
  target_responses: z.number().int().min(1).max(1000)
})

export async function postSurvey(data: { google_form_url: string, target_responses: number }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const parsed = surveySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const userId = session.user.id

  // Enforce one active/paused survey
  const existingActive = await prisma.survey.findFirst({
    where: {
      owner_id: userId,
      status: { in: ['ACTIVE', 'PAUSED'] }
    }
  })

  if (existingActive) {
    return { error: 'You already have an active or paused survey. Cancel or complete it before posting a new one.' }
  }

  // Get user balance
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'User not found' }

  const status = user.credit_balance > 0 ? 'ACTIVE' : 'PAUSED'

  const survey = await prisma.survey.create({
    data: {
      owner_id: userId,
      google_form_url: parsed.data.google_form_url,
      target_responses: parsed.data.target_responses,
      status
    }
  })

  return { success: true, surveyId: survey.id }
}

export async function cancelSurvey(surveyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const survey = await prisma.survey.findUnique({ where: { id: surveyId } })
  if (!survey) return { error: 'Survey not found' }
  if (survey.owner_id !== session.user.id) return { error: 'Unauthorized' }
  if (survey.status === 'COMPLETED' || survey.status === 'CANCELLED') {
    return { error: 'Survey is already completed or cancelled' }
  }

  await prisma.survey.update({
    where: { id: surveyId },
    data: { status: 'CANCELLED' }
  })

  return { success: true }
}
