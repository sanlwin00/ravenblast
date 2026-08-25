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
      <h1 className="text-2xl font-semibold mb-6">Blast History</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-16">No blast history yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Subject</th>
                <th className="text-left px-4 py-3 font-medium">Profile</th>
                <th className="text-right px-4 py-3 font-medium">Sent / Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {history.map(s => (
                <tr key={s.sessionId} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{s.subject}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.smtpProfile}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    <span className="text-green-600">{s.sent}</span>
                    <span className="text-gray-400"> / {s.total}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => view(s)}
                      className="min-h-[44px] px-3 py-1 text-sm text-[#0078D4] hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
