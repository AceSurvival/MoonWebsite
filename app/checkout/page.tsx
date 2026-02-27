'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ToastProvider'
import Link from 'next/link'

interface CartItem {
  id: string
  name: string
  price: number
  imageUrl: string | null
  quantity: number
}

interface PaymentSettings {
  zelle: string
  bitcoin: string
  bitcoinQr: string | null
  cashapp: string
}

interface ShippingSettings {
  uspsUpsStandard: number
  ups2Day: number
  fedex2Day: number
}

export default function CheckoutPage() {
  const [step, setStep] = useState(1) // 1: Cart, 2: Information, 3: Shipping, 4: Payment
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [discountApplied, setDiscountApplied] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE')
  const [discountMessage, setDiscountMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'ZELLE' | 'BITCOIN' | 'CASHAPP' | ''>('')
  const [shippingMethod, setShippingMethod] = useState<string>('')
  const [orderNotes, setOrderNotes] = useState('')
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingPostalCode: '',
    billingCountry: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [taxRate, setTaxRate] = useState(0)
  const [shippingAmount, setShippingAmount] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(true) // Pre-checked
  const [termsAccepted, setTermsAccepted] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCart(storedCart)

    // Check if promo code was applied in cart
    const appliedPromoCode = localStorage.getItem('appliedPromoCode')
    if (appliedPromoCode) {
      try {
        const promoData = JSON.parse(appliedPromoCode)
        setDiscountCode(promoData.code)
        setDiscountPercent(promoData.percent)
        setDiscountApplied(true)
        setDiscountMessage({ type: 'success', text: `Promo code applied! ${promoData.percent}% off` })
        // Clear it so it doesn't persist if user removes it
        localStorage.removeItem('appliedPromoCode')
      } catch (error) {
        console.error('Failed to parse applied promo code:', error)
      }
    }

    async function fetchSettings() {
      try {
        const [paymentRes, taxShippingRes, shippingPricesRes] = await Promise.all([
          fetch('/api/settings/payment', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
          fetch('/api/settings/tax-shipping', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
          fetch('/api/settings/shipping-prices', {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
        ])
        
        if (paymentRes.ok) {
          const data = await paymentRes.json()
          setPaymentSettings(data)
        }
        
        if (taxShippingRes.ok) {
          const data = await taxShippingRes.json()
          setTaxRate(data.taxRate || 0)
        }

        if (shippingPricesRes.ok) {
          const data = await shippingPricesRes.json()
          setShippingSettings(data)
          // Set default shipping method
          if (data.uspsUpsStandard) {
            setShippingMethod('USPS/UPS Standard')
            setShippingAmount(data.uspsUpsStandard)
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      }
    }
    fetchSettings()
  }, [])

  // Calculate tax when subtotal or tax rate changes (only for California)
  useEffect(() => {
    if (formData.state?.toUpperCase() === 'CA' && taxRate > 0) {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const calculatedDiscountAmount = discountApplied 
        ? (discountType === 'FIXED_AMOUNT' 
            ? Math.min(discountAmount, subtotal)
            : (subtotal * discountPercent) / 100)
        : 0
      const bitcoinDiscount = paymentMethod === 'BITCOIN' ? (subtotal * 10) / 100 : 0
      const subtotalAfterDiscount = subtotal - calculatedDiscountAmount - bitcoinDiscount
      const tax = (subtotalAfterDiscount * taxRate) / 100
      setTaxAmount(Math.round(tax * 100) / 100)
    } else {
      setTaxAmount(0)
    }
  }, [cart, discountApplied, discountPercent, discountAmount, discountType, taxRate, formData.state, paymentMethod])

  // Update shipping amount when shipping method changes
  useEffect(() => {
    if (!shippingSettings) return
    
    switch (shippingMethod) {
      case 'USPS/UPS Standard':
        setShippingAmount(shippingSettings.uspsUpsStandard || 15)
        break
      case 'UPS 2 Day':
        setShippingAmount(shippingSettings.ups2Day || 25)
        break
      case 'FedEx 2 Day':
        setShippingAmount(shippingSettings.fedex2Day || 30)
        break
      default:
        setShippingAmount(0)
    }
  }, [shippingMethod, shippingSettings])

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) return

    try {
      const res = await fetch(`/api/discount-codes/${discountCode}`)
      if (res.ok) {
        const data = await res.json()
        setDiscountApplied(true)
        setDiscountType(data.discountType || 'PERCENTAGE')
        setDiscountPercent(data.discountPercent || 0)
        setDiscountAmount(data.discountAmount || 0)
        
        const discountText = data.discountType === 'FIXED_AMOUNT'
          ? `Discount code applied! $${data.discountAmount?.toFixed(2)} off`
          : `Discount code applied! ${data.discountPercent}% off`
        setDiscountMessage({ type: 'success', text: discountText })
        setTimeout(() => setDiscountMessage(null), 3000)
      } else {
        const errorData = await res.json().catch(() => ({}))
        setDiscountMessage({ type: 'error', text: errorData.error || 'Invalid discount code' })
        setDiscountApplied(false)
        setDiscountPercent(0)
        setDiscountAmount(0)
      }
    } catch (error) {
      setDiscountMessage({ type: 'error', text: 'Failed to apply discount code. Please try again.' })
      setDiscountApplied(false)
      setDiscountPercent(0)
      setDiscountAmount(0)
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const calculatedDiscountAmount = discountApplied 
    ? (discountType === 'FIXED_AMOUNT' 
        ? Math.min(discountAmount, subtotal) // Don't exceed subtotal
        : (subtotal * discountPercent) / 100)
    : 0
  // Apply 10% Bitcoin discount
  const bitcoinDiscountAmount = paymentMethod === 'BITCOIN' ? (subtotal * 10) / 100 : 0
  const subtotalAfterDiscount = subtotal - calculatedDiscountAmount - bitcoinDiscountAmount
  const total = subtotalAfterDiscount + taxAmount + shippingAmount

  const handleNextStep = () => {
    if (step === 1) {
      // Validate cart
      if (cart.length === 0) {
        showToast('Your cart is empty', 'error')
        return
      }
      setStep(2)
    } else if (step === 2) {
      // Validate information
      if (!formData.name || !formData.email || !formData.address || !formData.city || !formData.state || !formData.postalCode || !formData.country) {
        showToast('Please fill in all required fields', 'error')
        return
      }
      if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showToast('Please enter a valid email address', 'error')
        return
      }
      setStep(3)
    } else if (step === 3) {
      // Validate shipping
      if (!shippingMethod) {
        showToast('Please select a shipping method', 'error')
        return
      }
      setStep(4)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentMethod) {
      showToast('Please select a payment method', 'error')
      return
    }
    if (!termsAccepted) {
      showToast('Please accept the terms and conditions', 'error')
      return
    }

    setSubmitting(true)

    try {
      const billingAddress = sameAsShipping ? null : {
        address: formData.billingAddress,
        city: formData.billingCity,
        state: formData.billingState,
        postalCode: formData.billingPostalCode,
        country: formData.billingCountry,
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          ...formData,
          items: cart,
          paymentMethod,
          shippingMethod,
          orderNotes,
          discountCode: discountApplied ? discountCode : null,
          total,
          subtotal: subtotal,
          discountAmount: calculatedDiscountAmount + bitcoinDiscountAmount,
          taxAmount,
          shippingAmount,
          billingAddress,
          newsletterSubscribed,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        localStorage.removeItem('cart')
        window.dispatchEvent(new Event('storage'))
        router.push(`/order-confirmation/${data.orderNumber}`)
      } else {
        const error = await res.json()
        showToast(error.message || 'Failed to place order. Please try again.', 'error')
      }
    } catch (error) {
      showToast('Failed to place order. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (cart.length === 0 && step === 1) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">Your cart is empty.</p>
          <button
            onClick={() => router.push('/store')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 gradient-text dark:text-purple-400">Checkout</h1>

        {/* Step Indicator */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <button
                    onClick={() => {
                      if (step > s) {
                        setStep(s)
                      }
                    }}
                    disabled={step <= s}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0 transition-all ${
                      step >= s
                        ? step > s
                          ? 'bg-purple-600 text-white cursor-pointer hover:bg-purple-700 hover:scale-110'
                          : 'bg-purple-600 text-white cursor-default'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {s}
                  </button>
                  <div className="mt-1 sm:mt-2 text-[10px] sm:text-xs text-center text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {s === 1 && 'Cart'}
                    {s === 2 && 'Info'}
                    {s === 3 && 'Ship'}
                    {s === 4 && 'Pay'}
                  </div>
                </div>
                {s < 4 && (
                  <div
                    className={`h-1 flex-1 mx-1 sm:mx-2 min-w-[15px] sm:min-w-[20px] ${
                      step > s ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* Step 1: Cart */}
            {step === 1 && (
              <div className="glass p-4 sm:p-6 rounded-lg border border-purple-500/20">
                <h2 className="text-lg sm:text-xl font-bold mb-4 gradient-text">Review Your Cart</h2>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleNextStep}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}

            {/* Step 2: Information */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="glass p-6 rounded-lg border border-purple-500/20">
                  <h2 className="text-xl font-bold mb-4 gradient-text">Customer Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={async (e) => {
                          setFormData({ ...formData, email: e.target.value })
                          // Track abandoned cart when email is entered
                          if (e.target.value && e.target.value.includes('@') && cart.length > 0) {
                            try {
                              await fetch('/api/cart/abandoned', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  email: e.target.value,
                                  cartItems: cart,
                                }),
                              })
                            } catch (error) {
                              // Silently fail - don't interrupt checkout
                              console.error('Failed to track abandoned cart:', error)
                            }
                          }
                        }}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-lg border border-purple-500/20">
                  <h2 className="text-xl font-bold mb-4 gradient-text">Shipping Address</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Address *</label>
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2 text-sm sm:text-base">City *</label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2 text-sm sm:text-base">State *</label>
                        <input
                          type="text"
                          required
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2 text-sm sm:text-base">Postal Code *</label>
                        <input
                          type="text"
                          required
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2 text-sm sm:text-base">Country *</label>
                        <input
                          type="text"
                          required
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass p-4 sm:p-6 rounded-lg border border-purple-500/20">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 gradient-text">Billing Address</h2>
                  <div className="mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sameAsShipping}
                        onChange={(e) => setSameAsShipping(e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">Same as shipping address</span>
                    </label>
                  </div>
                  {!sameAsShipping && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Billing Address *</label>
                        <input
                          type="text"
                          required={!sameAsShipping}
                          value={formData.billingAddress}
                          onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2 text-sm sm:text-base">City *</label>
                          <input
                            type="text"
                            required={!sameAsShipping}
                            value={formData.billingCity}
                            onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2 text-sm sm:text-base">State *</label>
                          <input
                            type="text"
                            required={!sameAsShipping}
                            value={formData.billingState}
                            onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2 text-sm sm:text-base">Postal Code *</label>
                          <input
                            type="text"
                            required={!sameAsShipping}
                            value={formData.billingPostalCode}
                            onChange={(e) => setFormData({ ...formData, billingPostalCode: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2 text-sm sm:text-base">Country *</label>
                          <input
                            type="text"
                            required={!sameAsShipping}
                            value={formData.billingCountry}
                            onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-3 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Continue to Shipping
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Shipping */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="glass p-4 sm:p-6 rounded-lg border border-purple-500/20">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 gradient-text">Select Shipping Method</h2>
                  <div className="space-y-3">
                    <label className={`flex items-center p-3 sm:p-4 glass rounded-lg border-2 cursor-pointer transition-colors ${
                      shippingMethod === 'USPS/UPS Standard' 
                        ? 'border-purple-500' 
                        : 'border-purple-500/30 hover:border-purple-500'
                    }`}>
                      <input
                        type="radio"
                        name="shipping"
                        value="USPS/UPS Standard"
                        checked={shippingMethod === 'USPS/UPS Standard'}
                        onChange={(e) => setShippingMethod(e.target.value)}
                        className="mr-2 sm:mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">USPS/UPS Standard</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold text-sm sm:text-base">
                          ${shippingSettings?.uspsUpsStandard || 15}.00
                        </span>
                      </div>
                    </label>
                    <label className={`flex items-center p-3 sm:p-4 glass rounded-lg border-2 cursor-pointer transition-colors ${
                      shippingMethod === 'UPS 2 Day' 
                        ? 'border-purple-500' 
                        : 'border-purple-500/30 hover:border-purple-500'
                    }`}>
                      <input
                        type="radio"
                        name="shipping"
                        value="UPS 2 Day"
                        checked={shippingMethod === 'UPS 2 Day'}
                        onChange={(e) => setShippingMethod(e.target.value)}
                        className="mr-2 sm:mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">UPS 2 Day</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold text-sm sm:text-base">
                          ${shippingSettings?.ups2Day || 25}.00
                        </span>
                      </div>
                    </label>
                    <label className={`flex items-center p-3 sm:p-4 glass rounded-lg border-2 cursor-pointer transition-colors ${
                      shippingMethod === 'FedEx 2 Day' 
                        ? 'border-purple-500' 
                        : 'border-purple-500/30 hover:border-purple-500'
                    }`}>
                      <input
                        type="radio"
                        name="shipping"
                        value="FedEx 2 Day"
                        checked={shippingMethod === 'FedEx 2 Day'}
                        onChange={(e) => setShippingMethod(e.target.value)}
                        className="mr-2 sm:mr-3 flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">FedEx 2 Day</span>
                        <span className="text-purple-600 dark:text-purple-400 font-bold text-sm sm:text-base">
                          ${shippingSettings?.fedex2Day || 30}.00
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Discount Code */}
                <div className="glass p-4 sm:p-6 rounded-lg border border-purple-500/20">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 gradient-text">Discount Code</h2>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      disabled={discountApplied}
                      className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 disabled:opacity-50"
                    />
                    {!discountApplied ? (
                      <button
                        type="button"
                        onClick={applyDiscountCode}
                        className="px-6 py-2 bg-neon-teal dark:bg-teal-600 hover:bg-teal-600 dark:hover:bg-teal-700 text-black dark:text-white font-semibold rounded-lg transition-colors"
                      >
                        Apply
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDiscountApplied(false)
                          setDiscountCode('')
                          setDiscountPercent(0)
                        }}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {discountMessage && (
                    <p
                      className={`mt-2 text-sm font-semibold ${
                        discountMessage.type === 'success'
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {discountMessage.type === 'success' ? '✓' : '✗'} {discountMessage.text}
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div className="glass p-4 sm:p-6 rounded-lg border border-purple-500/20">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 gradient-text">Payment Method</h2>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 sm:p-4 glass rounded-lg border-2 border-purple-500/30 cursor-pointer hover:border-purple-500 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="ZELLE"
                        checked={paymentMethod === 'ZELLE'}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="mr-2 sm:mr-3 flex-shrink-0"
                      />
                      <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">Zelle</span>
                    </label>
                    <label className="flex items-center p-3 sm:p-4 glass rounded-lg border-2 border-purple-500/30 cursor-pointer hover:border-purple-500 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="BITCOIN"
                        checked={paymentMethod === 'BITCOIN'}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="mr-2 sm:mr-3 flex-shrink-0"
                      />
                      <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">Bitcoin (10% Discount)</span>
                    </label>
                    <label className="flex items-center p-3 sm:p-4 glass rounded-lg border-2 border-purple-500/30 cursor-pointer hover:border-purple-500 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        value="CASHAPP"
                        checked={paymentMethod === 'CASHAPP'}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="mr-2 sm:mr-3 flex-shrink-0"
                      />
                      <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm sm:text-base">Cash App</span>
                    </label>
                  </div>

                  {/* Warning Message */}
                  {paymentMethod && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold mb-2">
                        ⚠️ IMPORTANT: ONLY PUT YOUR ORDER NUMBER IN THE NOTES. DO NOT MENTION PEPTIDES / ANYTHING ELSE.
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        🔒 Payment instructions are provided after checkout and by email. Orders are processed once payment is confirmed.
                      </p>
                    </div>
                  )}

                  {paymentMethod && paymentSettings && (
                    <div className="mt-4 p-4 glass rounded-lg border border-purple-500/30">
                      {paymentMethod === 'ZELLE' && (
                        <div>
                          <p className="text-purple-600 dark:text-purple-400 font-semibold mb-2">Zelle Instructions:</p>
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{paymentSettings.zelle}</p>
                        </div>
                      )}
                      {paymentMethod === 'BITCOIN' && (
                        <div>
                          <p className="text-purple-600 dark:text-purple-400 font-semibold mb-2">Bitcoin Address:</p>
                          <p className="text-neon-teal font-mono break-all mb-2">
                            {paymentSettings.bitcoin}
                          </p>
                          {paymentSettings.bitcoinQr && (
                            <img
                              src={paymentSettings.bitcoinQr}
                              alt="Bitcoin QR Code"
                              className="w-48 h-48 mx-auto mt-4"
                            />
                          )}
                        </div>
                      )}
                      {paymentMethod === 'CASHAPP' && (
                        <div>
                          <p className="text-purple-600 dark:text-purple-400 font-semibold mb-2">Cash App Tag:</p>
                          <p className="text-neon-teal font-semibold text-xl">
                            {paymentSettings.cashapp}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Notes */}
                <div className="glass p-4 sm:p-6 rounded-lg border border-purple-500/20">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 gradient-text">Order Notes (Optional)</h2>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Add any special instructions or notes for your order..."
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 resize-none"
                  />
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Remember: Only include your order number in payment notes. Do not mention peptides or anything else.
                  </p>
                </div>

                {/* Newsletter Subscription */}
                <div className="glass p-4 sm:p-6 rounded-lg border border-purple-500/20">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newsletterSubscribed}
                      onChange={(e) => setNewsletterSubscribed(e.target.checked)}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      Subscribe to our newsletter
                    </span>
                  </label>
                </div>

                {/* Terms and Age Confirmation */}
                <div className="glass p-4 sm:p-6 rounded-lg border border-purple-500/20">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      required
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      I confirm that I am 21 years of age or older<br />
                      I have read and agree to the Terms & Conditions, and that all products purchased are intended strictly for lawful laboratory research use only.<br />
                      I understand and agree these products are not approved by the FDA, and are not intended for human or animal consumption, diagnosis, treatment, cure, or prevention of any disease.
                    </span>
                  </label>
                </div>

                {/* Expedited Shipping Disclaimer */}
                <div className="glass p-4 sm:p-6 rounded-lg border border-blue-500/30 bg-blue-50 dark:bg-blue-900/10">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ</span>
                    <div>
                      <p className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        Expedited Shipping Disclaimer
                      </p>
                      <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-400">
                        Selecting 2-Day, Overnight, or Express shipping refers to FedEx's standard transit time after your order ships. Transit estimates do not include order processing time. Carrier delays (weather, holidays, volume, service disruptions, etc.) may occur and delivery dates cannot be guaranteed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !paymentMethod}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-700 dark:to-purple-600 hover:from-purple-600 hover:to-purple-700 dark:hover:from-purple-600 dark:hover:to-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="glass p-4 sm:p-6 rounded-lg border border-purple-500/20 lg:sticky lg:top-20">
              <h2 className="text-lg sm:text-xl font-bold mb-4 gradient-text">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-purple-500/20 pt-2 space-y-2">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-neon-teal">
                    <span>
                      Discount {discountType === 'FIXED_AMOUNT' 
                        ? `($${discountAmount.toFixed(2)})`
                        : `(${discountPercent}%)`}
                    </span>
                    <span>-${calculatedDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                {bitcoinDiscountAmount > 0 && (
                  <div className="flex justify-between text-neon-teal">
                    <span>Bitcoin Payment Discount (10%)</span>
                    <span>-${bitcoinDiscountAmount.toFixed(2)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Tax</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                {shippingAmount > 0 && (
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Shipping</span>
                    <span>${shippingAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-900 dark:text-gray-100 font-bold text-lg pt-2 border-t border-purple-500/20 dark:border-purple-700/50">
                  <span>Total</span>
                  <span className="text-gray-900 dark:text-gray-100 font-bold">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
