import { useEffect, useCallback } from 'react'
import { useBlastStore } from '../store/blastStore'
import { ipc } from '../lib/ipc'

interface Props {
  onDone: () => void
}

export default function ProgressPanel({ onDone }: Props) {
  const { progress } = useBlastStore()

  const handleDone = useCallback(() => onDone(), [onDone])

  useEffect(() => {
    if (progress?.status === 'done' || progress?.status === 'aborted') {
      handleDone()
    }
  }, [progress?.status, handleDone])

  async function pause() {
    await ipc.blastPause()
  }

  async function resume() {
    await ipc.blastResume()
  }

  async function abort() {
    if (confirm('Abort the blast? Emails already sent cannot be recalled.')) {
      await ipc.blastCancel()
    }
  }

  if (!progress) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-10 text-center w-full max-w-sm">
        <div className="text-lg font-medium">Preparing blast...</div>
        <div className="text-sm text-gray-500 mt-2">Connecting to SMTP server</div>
      </div>
    )
  }

  const pct = progress.total > 0 ? Math.round((progress.sent / progress.total) * 100) : 0
  const remaining = progress.total - progress.sent

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md space-y-5">
      <div>
        <h2 className="text-xl font-semibold">
          {progress.status === 'paused' ? 'Paused' : 'Sending...'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate" title={progress.currentEmail}>
          {progress.currentEmail}
        </p>
      </div>

      <div>
        <div className="flex justify-between text-sm mb-1.5">
          <span>{pct}% complete</span>
          <span>{progress.sent} / {progress.total}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-[#0078D4] h-3 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">{progress.sent}</div>
          <div className="text-xs text-gray-500 mt-0.5">Sent ✅</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{remaining}</div>
          <div className="text-xs text-gray-500 mt-0.5">Remaining ⏳</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{progress.total}</div>
          <div className="text-xs text-gray-500 mt-0.5">Total</div>
        </div>
      </div>

      <div className="flex gap-3">
        {progress.status === 'paused' ? (
          <button
            onClick={resume}
            className="min-h-[44px] flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
          >
            Resume
          </button>
        ) : (
          <button
            onClick={pause}
            className="min-h-[44px] flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          >
            Pause
          </button>
        )}
        <button
          onClick={abort}
          className="min-h-[44px] flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
        >
          Abort
        </button>
      </div>
    </div>
  )
}
