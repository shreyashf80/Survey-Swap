import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminCreditsPage({
  searchParams
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  const resolvedParams = await searchParams
  const reasonFilter = resolvedParams.reason as any

  const transactions = await prisma.creditTransaction.findMany({
    where: reasonFilter ? { reason: reasonFilter } : undefined,
    orderBy: { created_at: 'desc' },
    include: {
      user: true,
      related_survey: true
    },
    take: 100, // Limit for ops dashboard
  })

  return (
    <div>
      <div className="flex justify-between items-center border-b pb-2 mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Credit Ledger</h2>
      </div>

      <div className="mb-6 flex items-center space-x-2 text-sm">
        <span className="font-bold text-gray-500 uppercase">Filter Reason:</span>
        <div className="flex space-x-2">
           <Link href={`?`} className={`px-2 py-1 border ${!reasonFilter ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>All</Link>
           <Link href={`?reason=SIGNUP_BONUS`} className={`px-2 py-1 border ${reasonFilter === 'SIGNUP_BONUS' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Signup Bonus</Link>
           <Link href={`?reason=EARNED_FILL`} className={`px-2 py-1 border ${reasonFilter === 'EARNED_FILL' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Earned Fill</Link>
           <Link href={`?reason=SPENT_ON_FILL`} className={`px-2 py-1 border ${reasonFilter === 'SPENT_ON_FILL' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Spent On Fill</Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-y border-gray-300 text-xs uppercase tracking-wider text-gray-600">
              <th className="p-3">Tx ID</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">User</th>
              <th className="p-3">Delta</th>
              <th className="p-3">Reason</th>
              <th className="p-3">Related Survey ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-gray-400">{tx.id.slice(0, 8)}...</td>
                <td className="p-3">{new Date(tx.created_at).toLocaleString()}</td>
                <td className="p-3 font-bold">{tx.user.username}</td>
                <td className={`p-3 font-bold ${tx.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.delta > 0 ? '+' : ''}{tx.delta}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    tx.reason === 'SIGNUP_BONUS' ? 'bg-purple-100 text-purple-800' :
                    tx.reason === 'EARNED_FILL' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.reason}
                  </span>
                </td>
                <td className="p-3 font-mono text-xs text-gray-500">
                  {tx.related_survey_id ? tx.related_survey_id.slice(0, 8) + '...' : '-'}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No transactions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
