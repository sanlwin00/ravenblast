import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ipc } from '../lib/ipc'
import { useBlastStore } from '../store/blastStore'
import type { BlastSummary } from '../types'

export default function History() {
  const [history, setHistory] = useState<BlastSummary[]>([])
  const [loading, setLoading] = useState(true)
  const { setSummary } = useBlastStore()
  const navigate = useNavigate()

  useEffect(() => {
    ipc.historyList().then(list => {
      setHistory(list)
      setLoading(false)
    })
  }, [])

  function view(s: BlastSummary) {
    setSummary(s)
    navigate('/summary')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Blast History</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500 dark:text-gray-400">No blast history yet. Send your first blast to see it here.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Subject</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Account</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Sent / Total</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {history.map(s => {
                const successRate = s.total > 0 ? Math.round((s.sent / s.total) * 100) : 0
                return (
                  <tr key={s.sessionId} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                      {new Date(s.timestamp).toLocaleDateString()}<br />
                      <span>{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-5 py-3 max-w-xs truncate font-medium">{s.subject}</td>
                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{s.smtpProfile}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="font-semibold text-green-600">{s.sent}</span>
                      <span className="text-gray-400"> / {s.total}</span>
                      <div className="text-xs text-gray-400">{successRate}% success</div>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => view(s)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        📊 View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
