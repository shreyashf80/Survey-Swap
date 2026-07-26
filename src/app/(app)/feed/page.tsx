import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FillSurveyCard } from '@/components/FillSurveyCard'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const surveys = await prisma.survey.findMany({
    where: {
      status: 'ACTIVE',
      owner_id: { not: session.user.id },
      fill_events: {
        none: { filler_id: session.user.id }
      }
    },
    orderBy: { created_at: 'desc' },
    take: 20,
    include: {
      owner: {
        select: {
          name: true,
          username: true
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fill Surveys</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Earn 1 credit for every survey you complete.
          </p>
        </div>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No active surveys available right now.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <FillSurveyCard key={survey.id} survey={survey} fillerId={session.user.id} />
          ))}
        </div>
      )}
    </div>
  )
}
