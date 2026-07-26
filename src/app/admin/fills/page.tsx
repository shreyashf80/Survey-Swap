import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminFillsPage({
  searchParams
}: {
  searchParams: Promise<{ username?: string }>
}) {
  const resolvedParams = await searchParams
  const usernameFilter = resolvedParams.username

  const fills = await prisma.fillEvent.findMany({
    where: usernameFilter ? {
      filler: { username: { contains: usernameFilter, mode: 'insensitive' } }
    } : undefined,
    orderBy: { created_at: 'desc' },
    include: {
      filler: true,
      survey: { include: { owner: true } }
    },
    take: 100, // Limit for ops dashboard
  })

  return (
    <div>
      <div className="flex justify-between items-center border-b pb-2 mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Fill Event Audit Log</h2>
      </div>

      <div className="mb-6 flex space-x-4 text-sm">
        <form className="flex">
          <input 
            type="text" 
            name="username" 
            defaultValue={usernameFilter || ''}
            placeholder="Filter by filler username..." 
            className="border border-gray-400 p-2 outline-none w-64"
          />
          <button type="submit" className="bg-gray-900 text-white px-4 py-2 uppercase font-bold">Search</button>
          {usernameFilter && (
            <Link href="?" className="bg-gray-200 text-gray-700 px-4 py-2 uppercase font-bold ml-2 flex items-center">
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-y border-gray-300 text-xs uppercase tracking-wider text-gray-600">
              <th className="p-3">Event ID</th>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Filler Username</th>
              <th className="p-3">Survey Owner</th>
              <th className="p-3">Survey ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {fills.map(fill => (
              <tr key={fill.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-gray-400">{fill.id.slice(0, 8)}...</td>
                <td className="p-3">{new Date(fill.created_at).toLocaleString()}</td>
                <td className="p-3 font-bold text-indigo-700">{fill.filler.username}</td>
                <td className="p-3 font-medium">{fill.survey.owner.username}</td>
                <td className="p-3 font-mono text-xs">{fill.survey.id.slice(0, 8)}...</td>
              </tr>
            ))}
            {fills.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">No fill events found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
