export function FillHistoryList({ history }: { history: any[] }) {
  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Fill History</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">You haven't filled any surveys yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white">Recent Fills</h4>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {history.map((event) => (
          <li key={event.id} className="px-6 py-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Survey #{event.survey.id.slice(0, 6)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(event.created_at).toLocaleDateString()} at {new Date(event.created_at).toLocaleTimeString()}
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
              +1 Credit
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
