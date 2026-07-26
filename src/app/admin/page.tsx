import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    totalSurveys,
    totalFills,
    signups7Days,
    signups30Days,
    surveyStatusCounts,
    creditAggregation
  ] = await Promise.all([
    prisma.user.count(),
    prisma.survey.count(),
    prisma.fillEvent.count(),
    
    // Signups last 7 days
    prisma.user.count({
      where: { created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    }),
    
    // Signups last 30 days
    prisma.user.count({
      where: { created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    }),

    // Surveys grouped by status
    prisma.survey.groupBy({
      by: ['status'],
      _count: { _all: true }
    }),

    // Total credits in circulation
    prisma.user.aggregate({
      _sum: { credit_balance: true }
    })
  ])

  const creditsInCirculation = creditAggregation._sum.credit_balance || 0

  const activeSurveys = surveyStatusCounts.find(s => s.status === 'ACTIVE')?._count._all || 0
  const pausedSurveys = surveyStatusCounts.find(s => s.status === 'PAUSED')?._count._all || 0
  const completedSurveys = surveyStatusCounts.find(s => s.status === 'COMPLETED')?._count._all || 0

  return (
    <div>
      <h2 className="text-2xl font-bold border-b pb-2 mb-6 uppercase tracking-wider">Overview Metrics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="border border-gray-200 p-4 rounded shadow-sm">
          <h3 className="text-xs text-gray-500 font-bold uppercase mb-1">Total Users</h3>
          <p className="text-3xl font-black text-gray-900">{totalUsers.toLocaleString()}</p>
          <div className="mt-2 text-xs text-gray-600">
            <span className="font-semibold text-green-600">+{signups7Days}</span> in 7 days <br/>
            <span className="font-semibold text-green-600">+{signups30Days}</span> in 30 days
          </div>
        </div>

        <div className="border border-gray-200 p-4 rounded shadow-sm">
          <h3 className="text-xs text-gray-500 font-bold uppercase mb-1">Total Fills</h3>
          <p className="text-3xl font-black text-gray-900">{totalFills.toLocaleString()}</p>
        </div>

        <div className="border border-gray-200 p-4 rounded shadow-sm">
          <h3 className="text-xs text-gray-500 font-bold uppercase mb-1">Credits In Circulation</h3>
          <p className="text-3xl font-black text-gray-900">{creditsInCirculation.toLocaleString()}</p>
        </div>

        <div className="border border-gray-200 p-4 rounded shadow-sm">
          <h3 className="text-xs text-gray-500 font-bold uppercase mb-1">Survey Status</h3>
          <p className="text-3xl font-black text-gray-900">{totalSurveys.toLocaleString()}</p>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between"><span>ACTIVE</span> <strong>{activeSurveys}</strong></div>
            <div className="flex justify-between"><span>PAUSED</span> <strong>{pausedSurveys}</strong></div>
            <div className="flex justify-between"><span>COMPLETED</span> <strong>{completedSurveys}</strong></div>
          </div>
        </div>

      </div>
    </div>
  )
}
