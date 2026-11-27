import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, ShoppingBag, ShieldCheck } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()

  const [selectedMethod, setSelectedMethod] = useState(null) // 'card' | 'mp'
  const [paywayConfig, setPaywayConfig] = useState({ configured: false, env: 'sandbox', publicKey: null })
  const [loading, setLoading] = useState(false)
  const [mpLoading, setMpLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Datos de tarjeta (Payway)
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expMonth, setExpMonth] = useState('')
  const [expYear, setExpYear] = useState('')
  const [cvv, setCvv] = useState('')
  const [dni, setDni] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('1')
  const [installments, setInstallments] = useState('1')

  useEffect(() => {
    api
      .get('/payments/payway/config')
      .then((res) => setPaywayConfig(res.data))
      .catch(() => {})
  }, [])

  async function handleCardSubmit(e) {
    e.preventDefault()
    if (items.length === 0) return
    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      if (!paywayConfig.configured || !paywayConfig.publicKey) {
        setError('Faltan cargar las credenciales de Payway en el servidor.')
        setLoading(false)
        return
      }

      const cleanNumber = cardNumber.replace(/\s+/g, '')
      const paywayUrl =
        paywayConfig.env === 'production'
          ? 'https://live.decidir.com/api/v2/tokens'
          : 'https://developers.decidir.com/api/v2/tokens'

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
        setError(tokenData?.message || 'Error al validar la tarjeta')
        setLoading(false)
        return
      }

      const res = await api.post('/payments/payway/checkout', {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        buyerEmail: user?.email || undefined,
        token: tokenData.id,
        bin: cleanNumber.slice(0, 6),
        paymentMethodId: Number(paymentMethodId),
        installments: Number(installments),
      })

      if (res.data?.ok) {
        setSuccessMsg(`¡Pago aprobado! Tu número de orden es #${res.data.orderId}.`)
        clearCart()
        setSelectedMethod(null)
      } else {
        setError(`Pago en estado: ${res.data?.paywayStatus || 'pendiente'}`)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  async function handleMercadoPago() {
    if (items.length === 0) return
    setMpLoading(true)
    setError('')
    try {
      const res = await api.post('/payments/checkout', {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        buyerEmail: user?.email || undefined,
      })
      const redirectUrl = res.data.initPoint || res.data.sandboxInitPoint
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        setError('No se pudo obtener el enlace de pago de Mercado Pago.')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar el pago con Mercado Pago')
    } finally {
      setMpLoading(false)
    }
  }

  if (successMsg) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-mz-border dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard p-8 shadow-sm space-y-4">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">¡Compra realizada!</h1>
          <p className="text-slate-600 dark:text-slate-300">{successMsg}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border border-mz-border dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard p-8 shadow-sm space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tu carrito está vacío</h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
          >
            Ver productos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al catálogo
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
        Pasarela de Pago
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Columna izquierda: Resumen de compra */}
        <div className="lg:col-span-2 rounded-2xl border border-mz-border dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard p-6 shadow-sm h-fit space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Resumen de tu compra
          </h2>
          <div className="space-y-3 divide-y divide-slate-100 dark:divide-mz-darkBorder">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-3 pt-3 first:pt-0">
                <img
                  src={product.imageUrl || '/assets/products/placeholder.svg'}
                  alt={product.name}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-100 dark:bg-mz-darkSurface shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cantidad: {quantity}
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white shrink-0">
                  ${(product.price * quantity).toLocaleString('es-AR')}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-mz-darkBorder flex items-center justify-between text-lg font-bold text-slate-900 dark:text-white">
            <span>Total</span>
            <span>${subtotal.toLocaleString('es-AR')} ARS</span>
          </div>
        </div>

        {/* Columna derecha: Medios de pago */}
        <div className="lg:col-span-3 rounded-2xl border border-mz-border dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Elegí cómo querés pagar
            </h2>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Pago seguro
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Opción 1: Tarjeta de crédito / débito */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setError('')
                setSelectedMethod(selectedMethod === 'card' ? null : 'card')
              }}
              className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                selectedMethod === 'card'
                  ? 'border-primary-600 bg-primary-50/50 dark:bg-mz-darkSurface'
                  : 'border-slate-200 dark:border-mz-darkBorder hover:border-primary-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src="/assets/tarjeta-logo.png"
                  alt="Tarjeta"
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <span className="font-semibold text-slate-900 dark:text-white">
                  Pagar con tarjeta de crédito / débito
                </span>
              </div>
            </button>

            {selectedMethod === 'card' && (
              <form
                onSubmit={handleCardSubmit}
                className="p-4 rounded-xl border border-slate-200 dark:border-mz-darkBorder bg-slate-50/70 dark:bg-mz-darkSurface space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Tarjeta
                    </label>
                    <select
                      value={paymentMethodId}
                      onChange={(e) => setPaymentMethodId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard px-2.5 py-2 text-xs text-black dark:text-white"
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
                      className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard px-2.5 py-2 text-xs text-black dark:text-white"
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
                    className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard px-3 py-2 text-sm text-black dark:text-white"
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
                    className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard px-3 py-2 text-sm text-black dark:text-white"
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
                      className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard px-2.5 py-2 text-sm text-black dark:text-white"
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
                      className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard px-2.5 py-2 text-sm text-black dark:text-white"
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
                      className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard px-2.5 py-2 text-sm text-black dark:text-white"
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
                    className="w-full rounded-lg border border-slate-200 dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard px-3 py-2 text-sm text-black dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {loading ? 'Procesando pago...' : `Pagar $${subtotal.toLocaleString('es-AR')} ARS`}
                </button>
              </form>
            )}
          </div>

          {/* Opción 2: Mercado Pago */}
          <button
            type="button"
            disabled={mpLoading}
            onClick={handleMercadoPago}
            className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-mz-darkBorder hover:border-primary-400 disabled:opacity-60 flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              {mpLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              ) : (
                <img
                  src="/assets/mercadopago-logo.jpg"
                  alt="Mercado Pago"
                  className="h-8 w-auto rounded object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
              <span className="font-semibold text-slate-900 dark:text-white">
                {mpLoading ? 'Conectando con Mercado Pago...' : 'Mercado Pago'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
