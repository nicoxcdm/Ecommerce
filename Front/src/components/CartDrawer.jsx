import { useEffect, useState } from 'react'
import { X, Trash2, Plus, Minus, ShoppingBag, CreditCard, Loader2, CheckCircle2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, subtotal } = useCart()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [paywayConfig, setPaywayConfig] = useState({ configured: false, env: 'sandbox', publicKey: null })
  const [showCardForm, setShowCardForm] = useState(false)

  // Campos de tarjeta para tokenización segura con Payway
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [dni, setDni] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('1') // 1=Visa, 104=Mastercard, 31=Visa Débito
  const [installments, setInstallments] = useState('1')

  useEffect(() => {
    if (!isOpen) return
    api
      .get('/payments/payway/config')
      .then((res) => setPaywayConfig(res.data))
      .catch(() => {})
  }, [isOpen])

  if (!isOpen) return null

  async function handlePaywaySubmit(e) {
    e.preventDefault()
    if (items.length === 0) return
    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      if (!paywayConfig.configured || !paywayConfig.publicKey) {
        setError('Payway está listo en el sistema, pero faltan cargar las claves (PAYWAY_PUBLIC_KEY y PAYWAY_PRIVATE_KEY) en Render.')
        setLoading(false)
        return
      }

      const cleanNumber = cardNumber.replace(/\s+/g, '')
      const paywayUrl =
        paywayConfig.env === 'production'
          ? 'https://live.decidir.com/api/v2/tokens'
          : 'https://developers.decidir.com/api/v2/tokens'

      // 1. Tokenizar tarjeta directo con Payway (el backend nunca ve el número de tarjeta)
      const tokenRes = await fetch(paywayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: paywayConfig.publicKey,
        },
        body: JSON.stringify({
          card_number: cleanNumber,
          card_expiration_month: expMonth.padStart(2, '0'),
          card_expiration_year: expYear.slice(-2),
          security_code: cvv,
          card_holder_name: cardHolder.trim(),
          card_holder_identification: {
            type: 'dni',
            number: dni.trim(),
          },
        }),
      })

      const tokenData = await tokenRes.json().catch(() => ({}))
      if (!tokenRes.ok || !tokenData.id) {
        setError(tokenData?.message || 'Error al validar la tarjeta con Payway')
        setLoading(false)
        return
      }

      // 2. Enviar el token seguro a nuestro backend para procesar el cobro
      const res = await api.post('/payments/payway/checkout', {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        buyerEmail: user?.email || undefined,
        token: tokenData.id,
        bin: cleanNumber.slice(0, 6),
        paymentMethodId: Number(paymentMethodId),
        installments: Number(installments),
      })

      if (res.data?.ok) {
        setSuccessMsg(`¡Pago aprobado con Payway! Orden #${res.data.orderId}`)
        clearCart()
        setShowCardForm(false)
      } else {
        setError(`Pago en estado: ${res.data?.paywayStatus || 'pendiente'}`)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar el pago con Payway')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        onClick={() => setIsOpen(false)}
      />

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-mz-darkCard h-full shadow-2xl flex flex-col border-l border-mz-border dark:border-mz-darkBorder">
        {/* Header */}
        <div className="px-5 py-4 border-b border-mz-border dark:border-mz-darkBorder bg-[#F1DDD4]/50 dark:bg-mz-darkSurface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-600 dark:text-mz-peach" />
            <h2 className="text-lg font-bold text-mz-heading dark:text-mz-cream">Tu Carrito</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-mz-muted hover:bg-white/60 dark:hover:bg-mz-darkBorder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items o Formulario Payway */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Tu carrito está vacío</p>
              <p className="text-sm mt-1">Agregá productos para comenzar tu compra.</p>
            </div>
          ) : showCardForm ? (
            <form id="payway-form" onSubmit={handlePaywaySubmit} className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pago con Tarjeta (Payway / BBVA)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCardForm(false)}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Volver al carrito
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Tarjeta
                  </label>
                  <select
                    value={paymentMethodId}
                    onChange={(e) => setPaymentMethodId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-white dark:bg-mz-darkSurface px-2.5 py-2 text-xs text-black dark:text-white"
                  >
                    <option value="1">Visa Crédito</option>
                    <option value="31">Visa Débito</option>
                    <option value="104">Mastercard Crédito</option>
                    <option value="105">Mastercard Débito</option>
                    <option value="65">American Express</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Cuotas
                  </label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-white dark:bg-mz-darkSurface px-2.5 py-2 text-xs text-black dark:text-white"
                  >
                    <option value="1">1 pago</option>
                    <option value="3">3 cuotas</option>
                    <option value="6">6 cuotas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4507 9900 0000 4905"
                  className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-slate-50 dark:bg-mz-darkSurface px-3 py-2 text-sm text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Nombre y apellido del titular
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Como figura en la tarjeta"
                  className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-slate-50 dark:bg-mz-darkSurface px-3 py-2 text-sm text-black dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Mes
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={expMonth}
                    onChange={(e) => setExpMonth(e.target.value)}
                    placeholder="MM"
                    className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-slate-50 dark:bg-mz-darkSurface px-2.5 py-2 text-sm text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Año
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={expYear}
                    onChange={(e) => setExpYear(e.target.value)}
                    placeholder="AA"
                    className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-slate-50 dark:bg-mz-darkSurface px-2.5 py-2 text-sm text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-slate-50 dark:bg-mz-darkSurface px-2.5 py-2 text-sm text-black dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  DNI del titular
                </label>
                <input
                  type="text"
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Sin puntos"
                  className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-slate-50 dark:bg-mz-darkSurface px-3 py-2 text-sm text-black dark:text-white"
                />
              </div>
            </form>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
              >
                <img
                  src={product.imageUrl || '/assets/products/placeholder.svg'}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover bg-white dark:bg-slate-900 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm font-bold text-primary-600 mt-0.5">
                    ${Number(product.price).toLocaleString('es-AR')}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm font-medium">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      title="Quitar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-mz-darkCard">
            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="flex items-center justify-between text-base font-bold text-slate-900 dark:text-white">
              <span>Total</span>
              <span>${subtotal.toLocaleString('es-AR')} ARS</span>
            </div>

            {showCardForm ? (
              <button
                type="submit"
                form="payway-form"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                {loading ? 'Procesando con Payway...' : 'Confirmar pago con Payway'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setShowCardForm(true)
                }}
                className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                Pagar con Payway (Tarjeta)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
