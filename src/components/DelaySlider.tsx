interface Props {
  min: number
  max: number
  onMinChange: (v: number) => void
  onMaxChange: (v: number) => void
}

export default function DelaySlider({ min, max, onMinChange, onMaxChange }: Props) {
  function handleMinChange(v: number) {
    onMinChange(v)
    if (v > max) onMaxChange(v)
  }

  function handleMaxChange(v: number) {
    onMaxChange(v)
    if (v < min) onMinChange(v)
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-3">Send Delay Between Emails</label>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Minimum</span>
            <span className="font-semibold">{min}s</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={min}
            onChange={e => handleMinChange(Number(e.target.value))}
            className="w-full accent-[#0078D4]"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1s</span><span>30s</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Maximum</span>
            <span className="font-semibold">{max}s</span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            value={max}
            onChange={e => handleMaxChange(Number(e.target.value))}
            className="w-full accent-[#0078D4]"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1s</span><span>30s</span>
          </div>
        </div>
      </div>
    </div>
  )
}
