import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string, sort?: string }>
}) {
  const resolvedParams = await searchParams
  const query = resolvedParams.q || ''
  const sort = resolvedParams.sort || 'created_desc'

  let orderBy: any = { created_at: 'desc' }
  if (sort === 'created_asc') orderBy = { created_at: 'asc' }
  if (sort === 'credits_desc') orderBy = { credit_balance: 'desc' }
  if (sort === 'credits_asc') orderBy = { credit_balance: 'asc' }
  if (sort === 'fills_desc') orderBy = { total_forms_filled: 'desc' }
  if (sort === 'fills_asc') orderBy = { total_forms_filled: 'asc' }

  const users = await prisma.user.findMany({
    where: query ? {
      username: { contains: query, mode: 'insensitive' }
    } : undefined,
    orderBy,
    take: 100, // Limit to 100 for simplicity
  })

  return (
    <div>
      <div className="flex justify-between items-center border-b pb-2 mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider">Users Directory</h2>
      </div>

      <div className="mb-6 flex space-x-4 text-sm">
        <form className="flex">
          <input 
            type="text" 
            name="q" 
            defaultValue={query}
            placeholder="Search username..." 
            className="border border-gray-400 p-2 outline-none"
          />
          {sort && <input type="hidden" name="sort" value={sort} />}
          <button type="submit" className="bg-gray-900 text-white px-4 py-2 uppercase font-bold">Search</button>
        </form>

        <div className="flex items-center space-x-2">
          <span className="font-bold text-gray-500 uppercase">Sort:</span>
          <div className="flex space-x-2">
             <Link href={`?q=${query}&sort=created_desc`} className={`px-2 py-1 border ${sort === 'created_desc' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Newest</Link>
             <Link href={`?q=${query}&sort=credits_desc`} className={`px-2 py-1 border ${sort === 'credits_desc' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Credits</Link>
             <Link href={`?q=${query}&sort=fills_desc`} className={`px-2 py-1 border ${sort === 'fills_desc' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>Fills</Link>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-y border-gray-300 text-xs uppercase tracking-wider text-gray-600">
              <th className="p-3">ID</th>
              <th className="p-3">Username</th>
              <th className="p-3">Credits</th>
              <th className="p-3">Forms Filled</th>
              <th className="p-3">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-gray-400">{user.id}</td>
                <td className="p-3 font-bold">{user.username}</td>
                <td className="p-3">{user.credit_balance}</td>
                <td className="p-3">{user.total_forms_filled}</td>
                <td className="p-3">{new Date(user.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
