import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LogoutButton } from '@/components/LogoutButton'
import { RewardProvider } from '@/components/RewardProvider'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credit_balance: true, username: true }
  })

  if (!user) redirect('/login')

  return (
    <RewardProvider initialCredits={user.credit_balance}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/dashboard" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  SurveySwap
                </Link>
                <div className="hidden sm:flex space-x-4">
                  <Link href="/dashboard" className="text-gray-900 dark:text-white hover:text-indigo-600 font-medium px-3 py-2 rounded-md">My Survey</Link>
                  <Link href="/feed" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 font-medium px-3 py-2 rounded-md">Fill Surveys</Link>
                  <Link href="/leaderboard" className="text-gray-500 dark:text-gray-300 hover:text-indigo-600 font-medium px-3 py-2 rounded-md">Leaderboard</Link>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                  <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Credits:</span>
                  <AnimatedCounter value={user.credit_balance} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">@{user.username}</span>
                <LogoutButton />
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
      <ToastContainer position="bottom-right" autoClose={1200} hideProgressBar />
    </RewardProvider>
  )
}
