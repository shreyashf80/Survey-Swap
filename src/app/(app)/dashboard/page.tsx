import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PostSurveyForm } from '@/components/PostSurveyForm'
import { ActiveSurveyCard } from '@/components/ActiveSurveyCard'
import { AutoRefresher } from '@/components/AutoRefresher'
import { FillHistoryList } from '@/components/FillHistoryList'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) return null

  // Find non-terminal survey
  const survey = await prisma.survey.findFirst({
    where: {
      owner_id: session.user.id,
      status: { in: ['ACTIVE', 'PAUSED'] }
    }
  })

  // Find fill history
  const history = await prisma.fillEvent.findMany({
    where: { filler_id: session.user.id },
    include: { survey: true },
    orderBy: { created_at: 'desc' },
    take: 10
  })

  return (
    <>
      <AutoRefresher intervalMs={10000} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {survey ? (
            <ActiveSurveyCard survey={survey} />
          ) : (
            <PostSurveyForm />
          )}
        </div>
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How it works</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-3 list-disc pl-4">
              <li>You can only have one active survey at a time.</li>
              <li>Each response you request costs 1 credit.</li>
              <li>If you run out of credits, your survey pauses automatically.</li>
              <li>Fill other surveys in the feed to earn credits and resume yours!</li>
            </ul>
          </div>

          <FillHistoryList history={history} />
        </div>
      </div>
    </>
  )
}
