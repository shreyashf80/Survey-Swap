import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Leaderboard } from '@/components/Leaderboard'
import { AutoRefresher } from '@/components/AutoRefresher'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const topUsers = await prisma.user.findMany({
    orderBy: [
      { total_forms_filled: 'desc' },
      { created_at: 'asc' }
    ],
    take: 5,
    select: { id: true, username: true, total_forms_filled: true }
  })

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, total_forms_filled: true, created_at: true }
  })

  if (!currentUser) redirect('/login')

  const higherRankCount = await prisma.user.count({
    where: {
      OR: [
        { total_forms_filled: { gt: currentUser.total_forms_filled } },
        {
          total_forms_filled: currentUser.total_forms_filled,
          created_at: { lt: currentUser.created_at }
        }
      ]
    }
  })

  const currentUserRank = higherRankCount + 1

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <AutoRefresher intervalMs={15000} />
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">The top survey fillers of all time.</p>
      </div>

      <Leaderboard topUsers={topUsers} currentUser={currentUser} currentUserRank={currentUserRank} />
    </div>
  )
}
