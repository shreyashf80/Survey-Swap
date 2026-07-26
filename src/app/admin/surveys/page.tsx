import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminSurveysPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const resolvedParams = await searchParams
  const statusFilter = resolvedParams.status as any

  const surveys = await prisma.survey.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { created_at: 'desc' },
    include: { owner: true },
    take: 100, // Limit for ops dashboard
  })

  return (
    <div>
      <div className="flex justify-between items-center border-b pb-2 mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Surveys Registry</h2>
      </div>

      <div className="mb-6 flex items-center space-x-2 text-sm">
        <span className="font-bold text-gray-500 uppercase">Filter Status:</span>
        <div className="flex space-x-2">
           <Link href={`?`} className={`px-2 py-1 border ${!statusFilter ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>All</Link>
           <Link href={`?status=ACTIVE`} className={`px-2 py-1 border ${statusFilter === 'ACTIVE' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Active</Link>
           <Link href={`?status=PAUSED`} className={`px-2 py-1 border ${statusFilter === 'PAUSED' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Paused</Link>
           <Link href={`?status=COMPLETED`} className={`px-2 py-1 border ${statusFilter === 'COMPLETED' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Completed</Link>
           <Link href={`?status=CANCELLED`} className={`px-2 py-1 border ${statusFilter === 'CANCELLED' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Cancelled</Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-y border-gray-300 text-xs uppercase tracking-wider text-gray-600">
              <th className="p-3">ID</th>
              <th className="p-3">Owner</th>
              <th className="p-3">Google Form URL</th>
              <th className="p-3">Progress</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {surveys.map(survey => (
              <tr key={survey.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-gray-400">{survey.id.slice(0, 8)}...</td>
                <td className="p-3 font-bold">{survey.owner.username}</td>
                <td className="p-3 max-w-xs truncate" title={survey.google_form_url}>
                  <a href={survey.google_form_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {survey.google_form_url}
                  </a>
                </td>
                <td className="p-3 font-mono">{survey.current_responses} / {survey.target_responses}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 text-xs font-bold rounded ${
                    survey.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    survey.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                    survey.status === 'COMPLETED' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {survey.status}
                  </span>
                </td>
                <td className="p-3">{new Date(survey.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {surveys.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No surveys found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
