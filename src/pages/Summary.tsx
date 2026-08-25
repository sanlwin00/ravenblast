import { useNavigate } from 'react-router-dom'
import { useBlastStore } from '../store/blastStore'
import type { BlastError } from '../types'

export default function Summary() {
  const { summary, setSummary, setContacts } = useBlastStore()
  const navigate = useNavigate()

  if (!summary) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 text-center text-gray-500 dark:text-gray-400 py-16">
        No blast summary available. <button onClick={() => navigate('/')} className="text-[#0078D4] hover:underline">Go to Composer</button>
      </div>
    )
  }

  function exportCsv() {
    if (!summary) return
    const rows: string[][] = [['Email', 'Error'], ...summary.errors.map((e: BlastError) => [e.email, e.message])]
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ravenblast-${summary.sessionId.slice(0, 8)}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function startNew() {
    setSummary(null)
    setContacts([])
    navigate('/')
  }

  const durationSec = Math.round(summary.duration / 1000)
  const successRate = summary.total > 0 ? Math.round((summary.sent / summary.total) * 100) : 0

  const stats = [
    { label: 'Total', value: summary.total, colorClass: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
    { label: 'Sent', value: summary.sent, colorClass: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
    { label: 'Failed', value: summary.failed, colorClass: 'bg-red-50 dark:bg-red-900/20 text-red-600' },
    { label: 'Skipped', value: summary.skipped, colorClass: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' }
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Blast Complete</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {summary.subject} · {new Date(summary.timestamp).toLocaleString()} · {durationSec}s · {successRate}% success
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {stats.map(({ label, value, colorClass }) => (
            <div key={label} className={`rounded-lg p-4 text-center ${colorClass}`}>
              <div className="text-3xl font-bold">{value}</div>
              <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        {summary.errors.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-3">Failed Sends ({summary.errors.length})</h2>
            <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Email</th>
                    <th className="text-left px-4 py-2 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.errors.map((e: BlastError, i: number) => (
                    <tr key={i} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2">{e.email}</td>
                      <td className="px-4 py-2 text-red-600 dark:text-red-400">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <button onClick={exportCsv}
            className="min-h-[44px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
            Export CSV
          </button>
          <button onClick={startNew}
            className="min-h-[44px] px-6 py-2 bg-[#0078D4] text-white rounded hover:bg-blue-600 ml-auto font-medium">
            Start New Blast
          </button>
        </div>
      </div>
    </div>
  )
}
