'use client'

import { useState, useEffect } from 'react'
import SyringeVisual from '@/components/SyringeVisual'
import ProductCard from '@/components/ProductCard'

// Syringe Icon Component
function SyringeIcon({ units }: { units: number }) {
  const height = 60
  const width = 20
  const barrelHeight = height * 0.7
  
  return (
    <svg width={width + 10} height={height + 15} viewBox={`0 0 ${width + 10} ${height + 15}`}>
      {/* Barrel */}
      <rect
        x={5}
        y={5}
        width={width}
        height={barrelHeight}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        rx="2"
      />
      {/* Plunger */}
      <rect
        x={3}
        y={5 + barrelHeight}
        width={width + 4}
        height={height * 0.3}
        fill="currentColor"
        opacity="0.3"
        rx="3"
      />
      {/* Needle hub */}
      <rect
        x={width / 2 + 3}
        y={5 + barrelHeight + height * 0.3}
        width="4"
        height="8"
        fill="currentColor"
        rx="1"
      />
      {/* Needle */}
      <line
        x1={width / 2 + 5}
        y1={5 + barrelHeight + height * 0.3 + 8}
        x2={width / 2 + 5}
        y2={5 + barrelHeight + height * 0.3 + 15}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Unit markings */}
      {units === 100 && (
        <>
          <line x1={5} y1={5 + barrelHeight * 0.25} x2={7} y2={5 + barrelHeight * 0.25} stroke="currentColor" strokeWidth="1" />
          <line x1={5} y1={5 + barrelHeight * 0.5} x2={7} y2={5 + barrelHeight * 0.5} stroke="currentColor" strokeWidth="1" />
          <line x1={5} y1={5 + barrelHeight * 0.75} x2={7} y2={5 + barrelHeight * 0.75} stroke="currentColor" strokeWidth="1" />
        </>
      )}
      {units === 50 && (
        <>
          <line x1={5} y1={5 + barrelHeight * 0.5} x2={7} y2={5 + barrelHeight * 0.5} stroke="currentColor" strokeWidth="1" />
        </>
      )}
      {units === 30 && (
        <>
          <line x1={5} y1={5 + barrelHeight * 0.33} x2={7} y2={5 + barrelHeight * 0.33} stroke="currentColor" strokeWidth="1" />
          <line x1={5} y1={5 + barrelHeight * 0.66} x2={7} y2={5 + barrelHeight * 0.66} stroke="currentColor" strokeWidth="1" />
        </>
      )}
    </svg>
  )
}

// Convert units to ml for insulin syringes
// U-100: 100 units = 1ml
// U-50: 50 units = 0.5ml (100 units = 1ml)
// U-30: 30 units = 0.3ml (100 units = 1ml)
// All use the same conversion: 100 units = 1ml
const unitsToMl = (units: number) => units / 100
const mlToUnits = (ml: number) => ml * 100

export default function CalculatorPage() {
  const [syringeUnits, setSyringeUnits] = useState<number | null>(null)
  const [syringeUnitsCustom, setSyringeUnitsCustom] = useState('')
  const [syringeUnitsType, setSyringeUnitsType] = useState<'preset' | 'custom'>('preset')

  const [vialQuantity, setVialQuantity] = useState<number | null>(null)
  const [vialQuantityCustom, setVialQuantityCustom] = useState('')
  const [vialQuantityType, setVialQuantityType] = useState<'preset' | 'custom'>('preset')

  const [waterAmount, setWaterAmount] = useState<number | null>(null)
  const [waterAmountCustom, setWaterAmountCustom] = useState('')
  const [waterAmountType, setWaterAmountType] = useState<'preset' | 'custom'>('preset')

  const [dose, setDose] = useState<number | null>(null)
  const [doseCustom, setDoseCustom] = useState('')
  const [doseType, setDoseType] = useState<'preset' | 'custom'>('preset')
  const [doseUnit, setDoseUnit] = useState<'mcg' | 'mg'>('mcg')

  // Suggested products (GLP products)
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // Reconstitution guide sections
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    environment: false,
    preparation: false,
    adding: false,
    storage: false,
  })

  // Fetch suggested GLP products
  useEffect(() => {
    async function fetchSuggestedProducts() {
      try {
        const res = await fetch(`/api/store/products?category=${encodeURIComponent("GLP's")}&page=1`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        if (res.ok) {
          const data = await res.json()
          // Limit to 6 products
          setSuggestedProducts((data.products || []).slice(0, 6))
        } else {
          // If API returns error, just set empty array
          setSuggestedProducts([])
        }
      } catch (error) {
        console.error('Failed to fetch suggested products:', error)
        // On error, set empty array so page still renders
        setSuggestedProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchSuggestedProducts()
  }, [])

  // Calculate the result
  const calculateResult = () => {
    const syringeUnitsValue = syringeUnitsType === 'preset' ? syringeUnits : parseFloat(syringeUnitsCustom)
    const vialQty = vialQuantityType === 'preset' ? vialQuantity : parseFloat(vialQuantityCustom)
    const waterAmt = waterAmountType === 'preset' ? waterAmount : parseFloat(waterAmountCustom)
    const doseAmt = doseType === 'preset' ? dose : parseFloat(doseCustom)

    if (!syringeUnitsValue || !vialQty || !waterAmt || !doseAmt || syringeUnitsValue <= 0 || vialQty <= 0 || waterAmt <= 0 || doseAmt <= 0) {
      return null
    }

    // Convert syringe units to ml
    const syringeVol = unitsToMl(syringeUnitsValue)

    // Convert dose to mcg (if it's in mg, multiply by 1000)
    const doseInMcg = doseUnit === 'mg' ? doseAmt * 1000 : doseAmt

    // Calculate concentration: mg/ml
    const concentrationMgPerMl = vialQty / waterAmt
    // Convert to mcg/ml
    const concentrationMcgPerMl = concentrationMgPerMl * 1000
    // Calculate volume needed for desired dose (in ml)
    const volumeNeededMl = doseInMcg / concentrationMcgPerMl
    // Convert to units
    const volumeNeededUnits = mlToUnits(volumeNeededMl)

    return {
      volumeNeededMl,
      volumeNeededUnits,
      syringeVolume: syringeVol,
      syringeUnits: syringeUnitsValue,
      hasWarning: volumeNeededMl > syringeVol
    }
  }

  const result = calculateResult()

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 gradient-text text-center">Peptide Calculator</h1>
        
        <div className="glass rounded-2xl border border-purple-500/20 dark:border-purple-700/50 p-8 shadow-xl">
          {/* Syringe Units */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              What type of syringe are you using?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              {[
                { type: 'U-100', units: 100, ml: 1.0 },
                { type: 'U-50', units: 50, ml: 0.5 },
                { type: 'U-30', units: 30, ml: 0.3 },
              ].map((syringe) => (
                <button
                  key={syringe.type}
                  onClick={() => {
                    setSyringeUnitsType('preset')
                    setSyringeUnits(syringe.units)
                    setSyringeUnitsCustom('')
                  }}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-300 ${
                    syringeUnitsType === 'preset' && syringeUnits === syringe.units
                      ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-500/50'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md'
                  }`}
                >
                  {/* Syringe Icon */}
                  <div className={`flex-shrink-0 ${syringeUnitsType === 'preset' && syringeUnits === syringe.units ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`}>
                    <SyringeIcon units={syringe.units} />
                  </div>
                  {/* Text */}
                  <div className="text-left">
                    <div className={`font-bold text-lg ${syringeUnitsType === 'preset' && syringeUnits === syringe.units ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                      {syringe.type}
                    </div>
                    <div className={`text-sm ${syringeUnitsType === 'preset' && syringeUnits === syringe.units ? 'text-purple-100' : 'text-gray-600 dark:text-gray-400'}`}>
                      {syringe.units} units ({syringe.ml} ml)
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Peptide Vial Quantity */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Select Peptide Vial Quantity
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {[5, 10, 15].map((qty) => (
                <button
                  key={qty}
                  onClick={() => {
                    setVialQuantityType('preset')
                    setVialQuantity(qty)
                    setVialQuantityCustom('')
                  }}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    vialQuantityType === 'preset' && vialQuantity === qty
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-purple-50 dark:bg-gray-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-700 hover:shadow-md'
                  }`}
                >
                  {qty} mg
                </button>
              ))}
              <button
                onClick={() => {
                  setVialQuantityType('custom')
                  setVialQuantity(null)
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  vialQuantityType === 'custom'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-purple-50 dark:bg-gray-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-700 hover:shadow-md'
                }`}
              >
                Other
              </button>
            </div>
            {vialQuantityType === 'custom' && (
              <div className="mt-3">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={vialQuantityCustom}
                  onChange={(e) => setVialQuantityCustom(e.target.value)}
                  placeholder="Enter vial quantity"
                  className="w-full px-4 py-3 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
              </div>
            )}
          </div>

          {/* Bacteriostatic Water Amount */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              How much bacteriostatic water are you adding?
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {[1, 2, 3, 5].map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setWaterAmountType('preset')
                    setWaterAmount(amt)
                    setWaterAmountCustom('')
                  }}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    waterAmountType === 'preset' && waterAmount === amt
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-purple-50 dark:bg-gray-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-700 hover:shadow-md'
                  }`}
                >
                  {amt} ml
                </button>
              ))}
              <button
                onClick={() => {
                  setWaterAmountType('custom')
                  setWaterAmount(null)
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  waterAmountType === 'custom'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-purple-50 dark:bg-gray-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-700 hover:shadow-md'
                }`}
              >
                Other
              </button>
            </div>
            {waterAmountType === 'custom' && (
              <div className="mt-3">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={waterAmountCustom}
                  onChange={(e) => setWaterAmountCustom(e.target.value)}
                  placeholder="Enter bacteriostatic water amount"
                  className="w-full px-4 py-3 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
              </div>
            )}
          </div>

          {/* Desired Dose */}
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              How much of the Peptide do you want in each dose?
            </label>
            <div className="mb-4">
              <div className="flex gap-4 mb-3">
                <button
                  onClick={() => setDoseUnit('mcg')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    doseUnit === 'mcg'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  mcg
                </button>
                <button
                  onClick={() => setDoseUnit('mg')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    doseUnit === 'mg'
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  mg
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-3">
              {doseUnit === 'mcg' ? (
                // mcg options
                [50, 100, 250, 500].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDoseType('preset')
                      setDose(d)
                      setDoseCustom('')
                    }}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                      doseType === 'preset' && dose === d && doseUnit === 'mcg'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-purple-50 dark:bg-gray-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-700 hover:shadow-md'
                    }`}
                  >
                    {d} mcg
                  </button>
                ))
              ) : (
                // mg options
                [1, 2, 3, 5, 10].map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDoseType('preset')
                      setDose(d)
                      setDoseCustom('')
                    }}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                      doseType === 'preset' && dose === d && doseUnit === 'mg'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                        : 'bg-purple-50 dark:bg-gray-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-700 hover:shadow-md'
                    }`}
                  >
                    {d} mg
                  </button>
                ))
              )}
              <button
                onClick={() => {
                  setDoseType('custom')
                  setDose(null)
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  doseType === 'custom'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-purple-50 dark:bg-gray-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-gray-700 hover:shadow-md'
                }`}
              >
                Other
              </button>
            </div>
            {doseType === 'custom' && (
              <div className="mt-3">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={doseCustom}
                  onChange={(e) => setDoseCustom(e.target.value)}
                  placeholder={`Enter peptide quantity in ${doseUnit}`}
                  className="w-full px-4 py-3 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="mt-8 p-6 rounded-lg bg-purple-50 dark:bg-gray-800 border border-purple-200 dark:border-purple-700">
              {result.hasWarning && (
                <div className="mb-4 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
                  <p className="text-red-800 dark:text-red-200 font-semibold">
                    ⚠️ Warning: Syringe volume is not sufficient for specified dosage
                  </p>
                </div>
              )}
              
              {/* Text Result */}
              <div className="mb-6 text-center">
                <p className="text-lg text-gray-900 dark:text-gray-100">
                  To have a dose of{' '}
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {doseType === 'preset' ? dose : parseFloat(doseCustom)} {doseUnit}
                  </span>{' '}
                  pull the syringe to{' '}
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {result.volumeNeededUnits % 1 === 0 ? result.volumeNeededUnits.toFixed(0) : result.volumeNeededUnits.toFixed(1)} units
                  </span>
                </p>
              </div>
              
              {/* Visual Syringe Representation */}
              <div className="border-t border-purple-200 dark:border-purple-700 pt-6">
                <h3 className="text-center font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Visual Guide
                </h3>
                <SyringeVisual
                  volumeNeededMl={result.volumeNeededMl}
                  maxVolumeMl={result.syringeVolume}
                  maxUnits={result.syringeUnits}
                  hasWarning={result.hasWarning}
                />
              </div>
            </div>
          )}
        </div>

        {/* Information Section */}
        <div className="mt-12 glass rounded-2xl border border-purple-500/20 dark:border-purple-700/50 p-8">
          <h2 className="text-2xl font-bold mb-6 gradient-text">How to Use the Peptide Calculator</h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              This calculator helps you determine the exact volume to draw into your syringe for a specific peptide dose.
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Step-by-step:</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Select or enter your syringe volume (typically 0.3ml, 0.5ml, or 1.0ml)</li>
                <li>Enter the peptide quantity in your vial (e.g., 5mg, 10mg, 15mg)</li>
                <li>Enter the amount of bacteriostatic water you're adding to reconstitute</li>
                <li>Enter your desired dose per injection (in micrograms/mcg)</li>
                <li>The calculator will show you exactly how much to draw into your syringe</li>
              </ol>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 italic">
              <strong>Note:</strong> This calculator is for research purposes only. Always ensure proper sterile technique when reconstituting peptides.
            </p>
          </div>
        </div>

        {/* Peptide Reconstitution Guide */}
        <div className="mt-12 glass rounded-2xl border border-purple-500/20 dark:border-purple-700/50 p-8">
          <h2 className="text-3xl font-bold mb-6 gradient-text text-center">Peptide Reconstitution Guide</h2>
          
          <div className="space-y-4 text-gray-700 dark:text-gray-300 mb-6">
            <p>
              Our peptides are delivered in the form of lyophilized (freeze-dried) powders, which are resistant to short-term temperature fluctuations during transport. At room temperature, peptides in powder form remain stable even for several weeks. However, it is essential to store them properly to maintain their integrity.
            </p>
            <p>
              Before usage for research purposes, the lyophilized powder must be reconstituted by mixing it with an appropriate solvent to form a solution. Accurate reconstitution is vital to ensure that the peptides retain their potency and bioactivity for further research and trials.
            </p>
          </div>

          {/* Collapsible Sections */}
          <div className="space-y-3">
            {/* Start Preparing the Environment */}
            <div className="border border-purple-200 dark:border-purple-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSections({ ...expandedSections, environment: !expandedSections.environment })}
                className="w-full px-6 py-4 flex items-center justify-between bg-purple-50 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-gray-100">Start Preparing the Environment</span>
                <svg
                  className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform ${expandedSections.environment ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.environment && (
                <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-purple-200 dark:border-purple-700">
                  <div className="space-y-3 text-gray-700 dark:text-gray-300">
                    <p>
                      Before beginning the reconstitution process, ensure you have a clean, sterile workspace. Wash your hands thoroughly and use appropriate personal protective equipment. Gather all necessary materials including the lyophilized peptide vial, bacteriostatic water, sterile syringes, and alcohol swabs.
                    </p>
                    <p>
                      Clean the work surface with an appropriate disinfectant and allow it to dry. Ensure the peptide vial and bacteriostatic water are at room temperature before beginning the reconstitution process.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Peptide and Solvent Preparation */}
            <div className="border border-purple-200 dark:border-purple-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSections({ ...expandedSections, preparation: !expandedSections.preparation })}
                className="w-full px-6 py-4 flex items-center justify-between bg-purple-50 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-gray-100">Peptide and Solvent Preparation</span>
                <svg
                  className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform ${expandedSections.preparation ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.preparation && (
                <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-purple-200 dark:border-purple-700">
                  <div className="space-y-3 text-gray-700 dark:text-gray-300">
                    <p>
                      Inspect the lyophilized peptide vial to ensure the powder appears dry and uniform. Check the vial for any signs of damage or contamination. Verify the peptide quantity and expiration date on the label.
                    </p>
                    <p>
                      For reconstitution, bacteriostatic water (BAC water) is the most commonly used solvent. It contains 0.9% benzyl alcohol which helps prevent bacterial growth. Ensure your bacteriostatic water is sterile and within its expiration date.
                    </p>
                    <p>
                      Calculate the amount of solvent needed based on your desired concentration. Use the calculator above to determine the appropriate volume for your research needs.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Adding the Solvent */}
            <div className="border border-purple-200 dark:border-purple-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSections({ ...expandedSections, adding: !expandedSections.adding })}
                className="w-full px-6 py-4 flex items-center justify-between bg-purple-50 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-gray-100">Adding the Solvent</span>
                <svg
                  className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform ${expandedSections.adding ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.adding && (
                <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-purple-200 dark:border-purple-700">
                  <div className="space-y-3 text-gray-700 dark:text-gray-300">
                    <p>
                      Clean the rubber stopper of both the peptide vial and the bacteriostatic water vial with an alcohol swab. Allow the alcohol to evaporate completely before proceeding.
                    </p>
                    <p>
                      Draw the calculated amount of bacteriostatic water into a sterile syringe. Insert the needle through the center of the peptide vial's rubber stopper at a slight angle to avoid coring. Slowly inject the solvent down the side of the vial, avoiding direct contact with the powder to minimize foaming.
                    </p>
                    <p>
                      Gently swirl or roll the vial between your hands to dissolve the powder. Do not shake vigorously as this can cause foaming and potentially denature the peptide. The powder should dissolve completely, forming a clear solution. If any particles remain, continue gentle swirling until fully dissolved.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Storage of Peptide Solutions */}
            <div className="border border-purple-200 dark:border-purple-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSections({ ...expandedSections, storage: !expandedSections.storage })}
                className="w-full px-6 py-4 flex items-center justify-between bg-purple-50 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-semibold text-gray-900 dark:text-gray-100">Storage of Peptide Solutions</span>
                <svg
                  className={`w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform ${expandedSections.storage ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedSections.storage && (
                <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-purple-200 dark:border-purple-700">
                  <div className="space-y-3 text-gray-700 dark:text-gray-300">
                    <p>
                      Proper storage of lyophilized peptide powder is crucial for maintaining its stability. Store the peptide powder at a minimum of +4°C for short-term use, and ideally at -20°C or lower for long-term storage.
                    </p>
                    <p>
                      Peptide solutions, once reconstituted, have a limited shelf life. In general, peptide solutions remain stable for 3 or more weeks at +4°C and 3-4 months at -20°C. To extend their viability, consider freezing aliquots of the solution in separate vials.
                    </p>
                    <p>
                      Avoid repeated cycles of freezing and thawing, as these can compromise peptide integrity. If you need to use the solution multiple times, divide it into smaller aliquots before freezing so you only thaw what you need for each use.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center italic">
              <strong className="text-gray-900 dark:text-gray-100">Important:</strong> This information is provided for educational and research purposes only. These instructions are intended solely for informational purposes and are not medical advice. Human consumption is strictly forbidden. Always follow proper laboratory safety protocols and sterile techniques when handling peptides.
            </p>
          </div>
        </div>

        {/* Suggested Products Section */}
        {suggestedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6 gradient-text text-center">Suggested Products</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
              Check out our GLP products perfect for your research needs
            </p>
            {loadingProducts ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

