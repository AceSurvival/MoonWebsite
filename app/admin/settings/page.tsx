'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    contactEmail: '',
    fromEmail: '',
    zelleInstructions: '',
    bitcoinAddress: '',
    bitcoinQr: '',
    cashappTag: '',
    taxRate: '0',
    shippingAmount: '0',
    freeShippingThreshold: '0',
    shippingType: 'flat',
    shippingOriginZip: '94544',
    shippingUspsUpsStandard: '15',
    shippingUps2Day: '25',
    shippingFedex2Day: '30',
    motd: '',
    promoBanner: '',
    logoImage: '',
    heroBackgroundImage: '',
    globalSalePercent: '0',
    globalSaleActive: false,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setFormData({
          contactEmail: data.contactEmail || '',
          fromEmail: data.fromEmail || '',
          zelleInstructions: data.zelleInstructions || '',
          bitcoinAddress: data.bitcoinAddress || '',
          bitcoinQr: data.bitcoinQr || '',
          cashappTag: data.cashappTag || '',
          taxRate: data.taxRate || '0',
          shippingAmount: data.shippingAmount || '0',
          freeShippingThreshold: data.freeShippingThreshold || '0',
          shippingType: data.shippingType || 'flat',
          shippingOriginZip: data.shippingOriginZip || '94544',
          shippingUspsUpsStandard: data.shippingUspsUpsStandard || '15',
          shippingUps2Day: data.shippingUps2Day || '25',
          shippingFedex2Day: data.shippingFedex2Day || '30',
          motd: data.motd || '',
          promoBanner: data.promoBanner || '',
          logoImage: data.logoImage || '',
          heroBackgroundImage: data.heroBackgroundImage || '',
          globalSalePercent: data.globalSalePercent || '0',
          globalSaleActive: data.globalSaleActive || false,
        })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size too large. Maximum size is 10MB.', 'error')
      return
    }

    setUploadingLogo(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'logo')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData({ ...formData, logoImage: data.url })
        showToast('Logo uploaded successfully!', 'success')
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to upload logo', 'error')
      }
    } catch (error) {
      showToast('Failed to upload logo', 'error')
    } finally {
      setUploadingLogo(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        showToast('Settings saved successfully!', 'success')
      } else {
        showToast('Failed to save settings', 'error')
      }
    } catch (error) {
      showToast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 gradient-text">Settings</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-2xl font-bold gradient-text mb-4">Email Settings</h2>
          
          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">From Email (Email address that sends emails to customers)</label>
            <input
              type="email"
              value={formData.fromEmail}
              onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
              placeholder="support@moonbeautyalchemy.com"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              <strong>This is the "from" address customers will see</strong> for order confirmations, status updates, and shipping notifications.
              <br />
              <strong>Recommended:</strong> support@moonbeautyalchemy.com
              <br />
              Must be verified with Resend before use.
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Contact Email (Where all emails are forwarded to)</label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="ace.mc.owner@gmail.com"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              All contact form submissions and notifications will be sent to this email address.
              <br />
              <strong>Recommended:</strong> ace.mc.owner@gmail.com
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>📧 Email Setup Required:</strong>
            </p>
            <ol className="text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside space-y-1">
              <li>Sign up for <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Resend</a> (free tier available)</li>
              <li>Get your API key from Resend dashboard</li>
              <li>Add <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">RESEND_API_KEY</code> to your Vercel environment variables</li>
              <li>Verify your domain <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">moonbeautyalchemy.com</code> in Resend Dashboard → Domains</li>
              <li>Add the DNS records Resend provides to your domain</li>
              <li>Once verified, set "From Email" to <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">support@moonbeautyalchemy.com</code></li>
              <li>Set "Contact Email" to <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">ace.mc.owner@gmail.com</code> to receive all emails</li>
            </ol>
          </div>
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Zelle Instructions</label>
          <textarea
            rows={4}
            value={formData.zelleInstructions}
            onChange={(e) => setFormData({ ...formData, zelleInstructions: e.target.value })}
            placeholder="Enter Zelle payment instructions (email, phone, etc.)"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Bitcoin Address</label>
          <input
            type="text"
            value={formData.bitcoinAddress}
            onChange={(e) => setFormData({ ...formData, bitcoinAddress: e.target.value })}
            placeholder="Enter Bitcoin wallet address"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Bitcoin QR Code Image URL</label>
          <input
            type="url"
            value={formData.bitcoinQr}
            onChange={(e) => setFormData({ ...formData, bitcoinQr: e.target.value })}
            placeholder="https://example.com/btc-qr.png"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Cash App Tag</label>
          <input
            type="text"
            value={formData.cashappTag}
            onChange={(e) => setFormData({ ...formData, cashappTag: e.target.value })}
            placeholder="$YourCashTag"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Tax Rate (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.taxRate}
            onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
            placeholder="0.00"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
          />
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Tax rate as a percentage (e.g., 8.5 for 8.5%). Applied to California orders only.</p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <h2 className="text-2xl font-bold gradient-text mb-4">Shipping Settings</h2>
          
          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Shipping Type</label>
            <select
              value={formData.shippingType}
              onChange={(e) => setFormData({ ...formData, shippingType: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            >
              <option value="flat">Flat Rate</option>
              <option value="distance">Distance Based (from origin zip)</option>
            </select>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Choose between flat rate or distance-based shipping calculation.</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Shipping Origin Zip Code</label>
            <input
              type="text"
              value={formData.shippingOriginZip}
              onChange={(e) => setFormData({ ...formData, shippingOriginZip: e.target.value })}
              placeholder="94544"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Origin zip code for distance-based shipping calculation.</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Flat Shipping Amount ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.shippingAmount}
              onChange={(e) => setFormData({ ...formData, shippingAmount: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Flat rate shipping amount (used when shipping type is "Flat Rate").</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Free Shipping Threshold ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.freeShippingThreshold}
              onChange={(e) => setFormData({ ...formData, freeShippingThreshold: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Order total amount required for free shipping. Set to 0 to disable free shipping.</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">USPS/UPS Standard Shipping Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.shippingUspsUpsStandard}
              onChange={(e) => setFormData({ ...formData, shippingUspsUpsStandard: e.target.value })}
              placeholder="15.00"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Price for USPS/UPS Standard shipping option.</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">UPS 2 Day Shipping Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.shippingUps2Day}
              onChange={(e) => setFormData({ ...formData, shippingUps2Day: e.target.value })}
              placeholder="25.00"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Price for UPS 2 Day shipping option.</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">FedEx 2 Day Shipping Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.shippingFedex2Day}
              onChange={(e) => setFormData({ ...formData, shippingFedex2Day: e.target.value })}
              placeholder="30.00"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Price for FedEx 2 Day shipping option.</p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <h2 className="text-2xl font-bold gradient-text mb-4">Global Sale</h2>
          
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.globalSaleActive}
                onChange={(e) => setFormData({ ...formData, globalSaleActive: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-gray-900 dark:text-gray-100 font-semibold">Enable Global Sale</span>
            </label>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 ml-6">
              When enabled, applies a discount to all products. Does not stack with individual product sales.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Global Sale Discount (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.globalSalePercent}
              onChange={(e) => setFormData({ ...formData, globalSalePercent: e.target.value })}
              placeholder="0.00"
              disabled={!formData.globalSaleActive}
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Discount percentage for global sale (e.g., 25 for 25% off).</p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <h2 className="text-2xl font-bold gradient-text mb-4">Site Content</h2>
          
          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Message of the Day (MOTD)</label>
            <input
              type="text"
              value={formData.motd || ''}
              onChange={(e) => setFormData({ ...formData, motd: e.target.value })}
              placeholder="Enter message of the day (appears at top of homepage)"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Optional message displayed at the top of the homepage.</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Promo Banner</label>
            <input
              type="text"
              value={formData.promoBanner || ''}
              onChange={(e) => setFormData({ ...formData, promoBanner: e.target.value })}
              placeholder="Enter promo/sale banner text"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Optional promotional banner displayed below MOTD.</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Logo Image</label>
            
            {/* File Upload */}
            <div className="mb-3">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Upload Logo Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="block w-full text-sm text-gray-900 dark:text-gray-100
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-purple-50 dark:file:bg-purple-900/30
                  file:text-purple-700 dark:file:text-purple-300
                  hover:file:bg-purple-100 dark:hover:file:bg-purple-900/50
                  file:cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
                  cursor-pointer"
              />
              {uploadingLogo && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Uploading...</p>
              )}
            </div>

            {/* URL Input (alternative) */}
            <div className="mb-3">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Or enter Logo Image URL</label>
              <input
                type="url"
                value={formData.logoImage || ''}
                onChange={(e) => setFormData({ ...formData, logoImage: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
              />
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Optional logo image to replace "HIGHROLLER PEPS" text in the top left. 
              Recommended size: 200x60px or similar aspect ratio.
            </p>
            {formData.logoImage && (
              <div className="mt-2">
                <img 
                  src={formData.logoImage} 
                  alt="Logo preview" 
                  className="h-12 w-auto border border-gray-300 dark:border-gray-700 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Hero Background Image</label>
            <input
              type="url"
              value={formData.heroBackgroundImage || ''}
              onChange={(e) => setFormData({ ...formData, heroBackgroundImage: e.target.value })}
              placeholder="https://example.com/hero-background.jpg"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-500"
            />
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Optional background image for the hero section (Shop Now/Learn More area) on the homepage. 
              Recommended size: 1920x1080px or similar aspect ratio.
            </p>
            {formData.heroBackgroundImage && (
              <div className="mt-2">
                <img 
                  src={formData.heroBackgroundImage} 
                  alt="Hero background preview" 
                  className="w-full max-w-md h-48 object-cover border border-gray-300 dark:border-gray-700 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-neon-purple hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}


