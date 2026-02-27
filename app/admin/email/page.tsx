'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ToastProvider'

interface EmailTemplates {
  initialOrder: { subject: string; body: string; html?: string }
  paymentConfirmed: { subject: string; body: string; html?: string }
  orderShipped: { subject: string; body: string; html?: string }
  orderCancelled: { subject: string; body: string; html?: string }
  abandonedCart: { subject: string; body: string; html?: string }
  adminNotification: { subject: string; body: string; html?: string }
}

type TemplateKey = keyof EmailTemplates

export default function AdminEmailPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingBulk, setSendingBulk] = useState(false)
  const { showToast } = useToast()
  
  const [templates, setTemplates] = useState<EmailTemplates>({
    initialOrder: { subject: '', body: '', html: '' },
    paymentConfirmed: { subject: '', body: '', html: '' },
    orderShipped: { subject: '', body: '', html: '' },
    orderCancelled: { subject: '', body: '', html: '' },
    abandonedCart: { subject: '', body: '', html: '' },
    adminNotification: { subject: '', body: '', html: '' },
  })
  
  const [activeTabs, setActiveTabs] = useState<Record<TemplateKey, 'html' | 'text'>>({
    initialOrder: 'html',
    paymentConfirmed: 'html',
    orderShipped: 'html',
    orderCancelled: 'html',
    abandonedCart: 'text',
    adminNotification: 'html',
  })

  const [expandedSections, setExpandedSections] = useState<Record<TemplateKey, boolean>>({
    initialOrder: false,
    paymentConfirmed: false,
    orderShipped: false,
    orderCancelled: false,
    abandonedCart: false,
    adminNotification: false,
  })
  
  const [processingAbandoned, setProcessingAbandoned] = useState(false)

  const [bulkEmail, setBulkEmail] = useState({
    subject: '',
    body: '',
    sendToAllCustomers: true,
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/email-templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates({
          initialOrder: data.initialOrder || { subject: '', body: '', html: '' },
          paymentConfirmed: data.paymentConfirmed || { subject: '', body: '', html: '' },
          orderShipped: data.orderShipped || { subject: '', body: '', html: '' },
          orderCancelled: data.orderCancelled || { subject: '', body: '', html: '' },
          abandonedCart: data.abandonedCart || { subject: '', body: '', html: '' },
          adminNotification: data.adminNotification || { subject: '', body: '', html: '' },
        })
      }
    } catch (error) {
      console.error('Failed to fetch email templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templates),
      })

      if (res.ok) {
        showToast('Email templates saved successfully!', 'success')
      } else {
        showToast('Failed to save email templates', 'error')
      }
    } catch (error) {
      showToast('Failed to save email templates', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkEmailSend = async () => {
    if (!bulkEmail.subject || !bulkEmail.body) {
      showToast('Please fill in both subject and body', 'error')
      return
    }

    if (!confirm(`Are you sure you want to send this email to ${bulkEmail.sendToAllCustomers ? 'ALL customers' : 'the first 100 customers'}?`)) {
      return
    }

    setSendingBulk(true)
    try {
      const res = await fetch('/api/admin/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkEmail),
      })

      const data = await res.json()
      if (res.ok) {
        showToast(`Bulk email sent! ${data.sent} sent, ${data.failed} failed`, 'success')
        if (data.errors && data.errors.length > 0) {
          console.error('Email errors:', data.errors)
        }
        setBulkEmail({ subject: '', body: '', sendToAllCustomers: true })
      } else {
        showToast(data.error || 'Failed to send bulk email', 'error')
      }
    } catch (error) {
      showToast('Failed to send bulk email', 'error')
    } finally {
      setSendingBulk(false)
    }
  }

  const toggleSection = (key: TemplateKey) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const emailTemplateInfo: Record<TemplateKey, { title: string; description: string; variables: string[] }> = {
    initialOrder: {
      title: 'Initial Order Email (Payment Instructions)',
      description: 'Sent when order is created (before payment). Includes payment instructions based on payment method.',
      variables: ['{{orderNumber}}', '{{customerName}}', '{{items}}', '{{subtotal}}', '{{discount}}', '{{shipping}}', '{{tax}}', '{{total}}', '{{paymentMethod}}', '{{shippingAddress}}', '{{billingAddress}}', '{{orderDate}}']
    },
    paymentConfirmed: {
      title: 'Payment Confirmed Email',
      description: 'Sent when order is marked as PAID. Includes order details and confirmation.',
      variables: ['{{orderNumber}}', '{{customerName}}', '{{items}}', '{{subtotal}}', '{{discount}}', '{{shipping}}', '{{tax}}', '{{total}}', '{{paymentMethod}}', '{{shippingAddress}}', '{{billingAddress}}', '{{orderDate}}']
    },
    orderShipped: {
      title: 'Order Shipped Email',
      description: 'Sent when order is marked as SHIPPED. Includes tracking information.',
      variables: ['{{orderNumber}}', '{{customerName}}', '{{trackingNumber}}', '{{shippingMethod}}', '{{shippingProvider}}', '{{shippingDate}}', '{{shippingAddress}}']
    },
    orderCancelled: {
      title: 'Order Cancelled Email',
      description: 'Sent when order is marked as CANCELED. Includes order details and cancellation notice.',
      variables: ['{{orderNumber}}', '{{customerName}}', '{{items}}', '{{subtotal}}', '{{discount}}', '{{shipping}}', '{{tax}}', '{{total}}', '{{paymentMethod}}', '{{shippingAddress}}', '{{billingAddress}}', '{{orderDate}}', '{{adminEmail}}']
    },
    abandonedCart: {
      title: 'Abandoned Cart Follow-Up Email',
      description: 'Sent automatically when customers leave items in their cart for more than 20 minutes. Includes a discount code.',
      variables: ['{{customerName}}', '{{cartItems}}', '{{discountCode}}', '{{discountPercent}}', '{{subtotal}}', '{{siteUrl}}', '{{adminEmail}}']
    },
    adminNotification: {
      title: 'Admin Order Notification Email',
      description: 'Sent to admin when a new order is placed. Includes all order details.',
      variables: ['{{orderNumber}}', '{{customerName}}', '{{email}}', '{{phone}}', '{{items}}', '{{subtotal}}', '{{tax}}', '{{shipping}}', '{{total}}', '{{paymentMethod}}', '{{shippingAddress}}', '{{billingAddress}}', '{{orderNotes}}']
    },
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 gradient-text">Email Management</h1>

      {/* Template Variables Reference */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm mb-8">
        <h2 className="text-2xl font-bold gradient-text mb-4">📋 Template Variables Reference</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Click any variable below to copy it. Use these variables in your email templates to personalize content.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Order Variables</h3>
            <div className="space-y-2">
              {['{{orderNumber}}', '{{items}}', '{{trackingNumber}}', '{{orderDate}}', '{{orderNotes}}'].map((varName) => (
                <button
                  key={varName}
                  onClick={() => {
                    navigator.clipboard.writeText(varName)
                    showToast(`Copied ${varName}`, 'success')
                  }}
                  className="block w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded font-mono text-sm text-purple-600 dark:text-purple-400 transition-colors"
                >
                  {varName}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Customer Variables</h3>
            <div className="space-y-2">
              {['{{customerName}}', '{{email}}', '{{phone}}'].map((varName) => (
                <button
                  key={varName}
                  onClick={() => {
                    navigator.clipboard.writeText(varName)
                    showToast(`Copied ${varName}`, 'success')
                  }}
                  className="block w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded font-mono text-sm text-purple-600 dark:text-purple-400 transition-colors"
                >
                  {varName}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Financial Variables</h3>
            <div className="space-y-2">
              {['{{subtotal}}', '{{discount}}', '{{shipping}}', '{{tax}}', '{{total}}'].map((varName) => (
                <button
                  key={varName}
                  onClick={() => {
                    navigator.clipboard.writeText(varName)
                    showToast(`Copied ${varName}`, 'success')
                  }}
                  className="block w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded font-mono text-sm text-purple-600 dark:text-purple-400 transition-colors"
                >
                  {varName}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">System Variables</h3>
            <div className="space-y-2">
              {['{{adminEmail}}', '{{siteUrl}}', '{{currentYear}}', '{{paymentMethod}}', '{{shippingMethod}}', '{{shippingProvider}}', '{{shippingAddress}}', '{{billingAddress}}'].map((varName) => (
                <button
                  key={varName}
                  onClick={() => {
                    navigator.clipboard.writeText(varName)
                    showToast(`Copied ${varName}`, 'success')
                  }}
                  className="block w-full text-left px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded font-mono text-sm text-purple-600 dark:text-purple-400 transition-colors"
                >
                  {varName}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Formatting Tips:</strong> Use <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded"># </code> for H1 headings, <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">## </code> for H2, <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">- </code> for bullet points. URLs are automatically converted to links. For HTML templates, use inline styles for best email client compatibility.
          </p>
        </div>
      </div>

      {/* Email Templates Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold gradient-text mb-2">Email Templates</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Customize all email templates. All emails include your logo and beautiful gradient design. HTML templates allow full customization while maintaining the format.
            </p>
          </div>
          <button
            onClick={handleTemplateSave}
            disabled={saving}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save All Templates'}
          </button>
        </div>

        {/* Template Sections */}
        {(Object.keys(emailTemplateInfo) as TemplateKey[]).map((templateKey) => {
          const info = emailTemplateInfo[templateKey]
          const template = templates[templateKey]
          const isExpanded = expandedSections[templateKey]
          const activeTab = activeTabs[templateKey]

          return (
            <div key={templateKey} className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(templateKey)}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
              >
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{info.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{info.description}</p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="p-6 bg-white dark:bg-gray-800">
                  <div className="mb-4">
                    <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Email Subject</label>
                    <input
                      type="text"
                      value={template.subject}
                      onChange={(e) => setTemplates({
                        ...templates,
                        [templateKey]: { ...template, subject: e.target.value }
                      })}
                      placeholder={`e.g., Order #{{orderNumber}} - ${info.title.split(' ')[0]}`}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setActiveTabs({ ...activeTabs, [templateKey]: 'html' })}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          activeTab === 'html'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        HTML Template
                      </button>
                      <button
                        onClick={() => setActiveTabs({ ...activeTabs, [templateKey]: 'text' })}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          activeTab === 'text'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Text Template
                      </button>
                    </div>

                    {activeTab === 'html' ? (
                      <div>
                        <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">
                          HTML Template (Full customization with inline styles)
                        </label>
                        <textarea
                          value={template.html || ''}
                          onChange={(e) => setTemplates({
                            ...templates,
                            [templateKey]: { ...template, html: e.target.value }
                          })}
                          placeholder="<div style='...'>HTML content here...</div>"
                          rows={25}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <strong>Available variables:</strong> {info.variables.join(', ')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <strong>Note:</strong> This HTML will be wrapped in the email template with logo and footer. Use inline styles for best compatibility.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Text Template (Auto-formatted)</label>
                        <textarea
                          value={template.body}
                          onChange={(e) => setTemplates({
                            ...templates,
                            [templateKey]: { ...template, body: e.target.value }
                          })}
                          placeholder={`Hi {{customerName}},\n\nYour order details...`}
                          rows={15}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <strong>Available variables:</strong> {info.variables.join(', ')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <strong>Formatting:</strong> Use # for H1, ## for H2, - for bullets. URLs auto-link.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={async () => {
              if (!confirm('Process abandoned carts now? This will send emails to customers who left items in their cart more than 20 minutes ago.')) {
                return
              }
              setProcessingAbandoned(true)
              try {
                const res = await fetch('/api/cart/process-abandoned', {
                  method: 'POST',
                })
                const data = await res.json()
                if (res.ok) {
                  showToast(`Processed ${data.processed} abandoned carts. ${data.errors} errors.`, 'success')
                } else {
                  showToast(data.error || 'Failed to process abandoned carts', 'error')
                }
              } catch (error) {
                showToast('Failed to process abandoned carts', 'error')
              } finally {
                setProcessingAbandoned(false)
              }
            }}
            disabled={processingAbandoned}
            className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingAbandoned ? 'Processing...' : 'Process Abandoned Carts Now'}
          </button>
        </div>
      </div>

      {/* Bulk Email Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-purple-200 dark:border-purple-700 shadow-sm">
        <h2 className="text-2xl font-bold gradient-text mb-4">Send Bulk Email</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          Send promotional emails, discount codes, or announcements to all customers. All emails include your logo and beautiful styling. Use variables from the reference above to personalize emails.
        </p>

        <div className="mb-4">
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Subject</label>
          <input
            type="text"
            value={bulkEmail.subject}
            onChange={(e) => setBulkEmail({ ...bulkEmail, subject: e.target.value })}
            placeholder="Special Discount Code Inside!"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-900 dark:text-gray-100 font-semibold mb-2">Email Body</label>
          <textarea
            value={bulkEmail.body}
            onChange={(e) => setBulkEmail({ ...bulkEmail, body: e.target.value })}
            placeholder="Hi {{customerName}},\n\nWe have a special discount code for you..."
            rows={15}
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tip: Use {'{{customerName}}'} to personalize. Use # for headings, - for bullet points. URLs auto-link.
          </p>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <input
              type="checkbox"
              checked={bulkEmail.sendToAllCustomers}
              onChange={(e) => setBulkEmail({ ...bulkEmail, sendToAllCustomers: e.target.checked })}
              className="w-4 h-4"
            />
            <span>Send to all customers (otherwise sends to first 100)</span>
          </label>
        </div>

        <button
          onClick={handleBulkEmailSend}
          disabled={sendingBulk || !bulkEmail.subject || !bulkEmail.body}
          className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendingBulk ? 'Sending...' : 'Send Bulk Email'}
        </button>
      </div>
    </div>
  )
}
