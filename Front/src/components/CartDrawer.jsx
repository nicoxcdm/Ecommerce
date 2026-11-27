import { useState } from 'react'
import { X, Trash2, Plus, Minus, ShoppingBag, CreditCard, Loader2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal } = useCart()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleCheckout() {
    if (items.length === 0) return
    setLoading(true)
    setError('')
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        buyerEmail: user?.email || undefined,
      }
      const res = await api.post('/payments/checkout', payload)
      const redirectUrl = res.data.initPoint || res.data.sandboxInitPoint
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        setError('No se pudo obtener el enlace de pago de Mercado Pago.')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar el pago con Mercado Pago')
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

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Tu carrito está vacío</p>
              <p className="text-sm mt-1">Agregá productos para comenzar tu compra.</p>
            </div>
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
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-slate-900">
            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="flex items-center justify-between text-base font-bold text-slate-900 dark:text-white">
              <span>Total</span>
              <span>${subtotal.toLocaleString('es-AR')} ARS</span>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleCheckout}
              className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
              {loading ? 'Conectando con Mercado Pago...' : 'Pagar con Mercado Pago'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
