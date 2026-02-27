'use client'

// Convert units to ml (assuming 100 units = 1ml for insulin syringes)
const mlToUnits = (ml: number) => ml * 100

interface SyringeVisualProps {
  volumeNeededMl: number
  maxVolumeMl: number
  maxUnits: number
  hasWarning: boolean
}

export default function SyringeVisual({ volumeNeededMl, maxVolumeMl, maxUnits, hasWarning }: SyringeVisualProps) {
  const fillPercentage = Math.min((volumeNeededMl / maxVolumeMl) * 100, 100)
  const syringeHeight = 300
  const syringeWidth = 80
  const barrelHeight = syringeHeight * 0.7
  const plungerHeight = syringeHeight * 0.3
  const fillHeight = (fillPercentage / 100) * barrelHeight
  
  // Calculate major and minor tick marks in units
  const tickCount = maxUnits
  const majorTicks: Array<{ value: number; y: number }> = []
  const minorTicks: Array<{ value: number; y: number }> = []
  const halfTicks: Array<{ value: number; y: number }> = []
  
  // Major ticks every 5 units
  for (let i = 0; i <= tickCount; i += 5) {
    const tickY = barrelHeight - (i / maxUnits) * barrelHeight
    majorTicks.push({ value: i, y: tickY })
  }
  
  // Minor ticks for whole units (but not on major ticks)
  for (let i = 0; i <= tickCount; i++) {
    if (i % 5 !== 0) {
      const tickY = barrelHeight - (i / maxUnits) * barrelHeight
      minorTicks.push({ value: i, y: tickY })
    }
  }
  
  // Half-unit ticks (0.5, 1.5, 2.5, etc.) for better precision
  for (let i = 0.5; i <= tickCount; i += 1) {
    if (i % 5 !== 0 && i % 1 !== 0) {
      const tickY = barrelHeight - (i / maxUnits) * barrelHeight
      halfTicks.push({ value: i, y: tickY })
    }
  }

  // Determine syringe type based on maxUnits
  const syringeType = maxUnits === 100 ? 'U-100' : maxUnits === 50 ? 'U-50' : 'U-30'
  
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="flex items-center gap-6">
        {/* Syringe Container */}
        <div className="relative" style={{ width: syringeWidth + 60, height: syringeHeight + 60 }}>
          <svg width={syringeWidth + 60} height={syringeHeight + 60} className="drop-shadow-lg">
            {/* Barrel (main body) - more realistic with rounded top */}
            <rect
              x={30}
              y={30}
              width={syringeWidth}
              height={barrelHeight}
              fill="#f8f9fa"
              stroke={hasWarning ? "#ef4444" : "#4b5563"}
              strokeWidth="2.5"
              rx="3"
              className="dark:fill-gray-800"
            />
            
            {/* Barrel top cap */}
            <rect
              x={28}
              y={28}
              width={syringeWidth + 4}
              height="4"
              fill="#e5e7eb"
              stroke="#9ca3af"
              strokeWidth="1"
              rx="2"
              className="dark:fill-gray-700 dark:stroke-gray-600"
            />
            
            {/* Fill level (liquid) */}
            <rect
              x={32}
              y={30 + barrelHeight - fillHeight}
              width={syringeWidth - 4}
              height={fillHeight}
              fill={hasWarning ? "#fca5a5" : "#a855f7"}
              opacity="0.8"
              rx="1"
            />
            
            {/* Volume markings - Half-unit ticks (smaller) */}
            {halfTicks.map((tick, i) => (
              <line
                key={`half-${i}`}
                x1={30}
                y1={30 + tick.y}
                x2={30 + 4}
                y2={30 + tick.y}
                stroke="#cbd5e1"
                strokeWidth="0.8"
              />
            ))}
            
            {/* Volume markings - Minor ticks */}
            {minorTicks.map((tick, i) => (
              <line
                key={`minor-${i}`}
                x1={30}
                y1={30 + tick.y}
                x2={30 + 6}
                y2={30 + tick.y}
                stroke="#9ca3af"
                strokeWidth="1"
              />
            ))}
            
            {/* Volume markings - Major ticks with labels */}
            {majorTicks.map((tick, i) => (
              <g key={`major-${i}`}>
                <line
                  x1={30}
                  y1={30 + tick.y}
                  x2={30 + 10}
                  y2={30 + tick.y}
                  stroke="#6b7280"
                  strokeWidth="2"
                />
                <text
                  x={30 - 6}
                  y={30 + tick.y + 4}
                  fontSize="11"
                  fill="#4b5563"
                  textAnchor="end"
                  fontWeight="600"
                  className="dark:fill-gray-300"
                >
                  {tick.value}
                </text>
              </g>
            ))}
            
            {/* Target fill line (where to pull to) */}
            <line
              x1={25}
              y1={30 + barrelHeight - fillHeight}
              x2={30 + syringeWidth + 5}
              y2={30 + barrelHeight - fillHeight}
              stroke={hasWarning ? "#ef4444" : "#DB6B9E"}
              strokeWidth="3"
              strokeDasharray="6,4"
              opacity="0.9"
            />
            
            {/* Plunger (rubber seal) */}
            <rect
              x={28}
              y={30 + barrelHeight - 2}
              width={syringeWidth + 4}
              height="6"
              fill="#dc2626"
              stroke="#991b1b"
              strokeWidth="1.5"
              rx="3"
            />
            
            {/* Plunger rod */}
            <rect
              x={syringeWidth / 2 + 26}
              y={30 + barrelHeight + 4}
              width="12"
              height={plungerHeight - 4}
              fill="#e5e7eb"
              stroke="#9ca3af"
              strokeWidth="1.5"
              rx="6"
              className="dark:fill-gray-600 dark:stroke-gray-500"
            />
            
            {/* Plunger thumb pad */}
            <rect
              x={syringeWidth / 2 + 22}
              y={30 + barrelHeight + plungerHeight - 8}
              width="20"
              height="12"
              fill="#d1d5db"
              stroke="#9ca3af"
              strokeWidth="1.5"
              rx="6"
              className="dark:fill-gray-700 dark:stroke-gray-600"
            />
            
            {/* Needle hub (Luer lock) */}
            <rect
              x={syringeWidth / 2 + 26}
              y={30 + barrelHeight + plungerHeight + 4}
              width="12"
              height="12"
              fill="#6b7280"
              stroke="#4b5563"
              strokeWidth="1.5"
              rx="2"
            />
            
            {/* Needle */}
            <line
              x1={syringeWidth / 2 + 32}
              y1={30 + barrelHeight + plungerHeight + 16}
              x2={syringeWidth / 2 + 32}
              y2={30 + barrelHeight + plungerHeight + 35}
              stroke="#374151"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            
            {/* Needle bevel */}
            <line
              x1={syringeWidth / 2 + 32}
              y1={30 + barrelHeight + plungerHeight + 35}
              x2={syringeWidth / 2 + 29}
              y2={30 + barrelHeight + plungerHeight + 38}
              stroke="#374151"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          
          {/* Max volume label */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 font-semibold">
            {syringeType} ({maxUnits} units)
          </div>
        </div>
        
        {/* Units label next to syringe */}
        <div className="flex flex-col items-center">
          <div className={`px-4 py-2 rounded-lg text-lg font-bold shadow-lg ${
            hasWarning 
              ? 'bg-red-500 text-white' 
              : 'bg-purple-600 text-white'
          }`}>
            {(() => {
              const units = mlToUnits(volumeNeededMl)
              return units % 1 === 0 ? units.toFixed(0) : units.toFixed(1)
            })()} units
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 text-center max-w-[120px]">
            Pull to this line
          </p>
        </div>
      </div>
      
      {/* Instructions */}
      <p className="mt-6 text-sm text-center text-gray-600 dark:text-gray-400 max-w-md">
        Pull the plunger until the liquid reaches the <span className="font-semibold text-purple-600 dark:text-purple-400">dashed line</span> at {(() => {
          const units = mlToUnits(volumeNeededMl)
          return units % 1 === 0 ? units.toFixed(0) : units.toFixed(1)
        })()} units
      </p>
    </div>
  )
}
