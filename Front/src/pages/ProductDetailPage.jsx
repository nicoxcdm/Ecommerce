import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingCart, Star, ArrowLeft, Send, Loader2 } from 'lucide-react'
import api from '../services/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function ProductDetailPage() {
  const { id } = useParams()
  const { addItem } = useCart()
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState('')
  const [quantity, setQuantity] = useState(1)

  // Reseña
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    setLoading(true)
    api
      .get(`/products/${id}`)
      .then((res) => {
        if (res.data && typeof res.data === 'object' && res.data.id) {
          setProduct(res.data)
          setActiveImage(res.data.imageUrl || '/assets/products/placeholder.svg')
        } else {
          setProduct(null)
        }
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  async function handleReviewSubmit(e) {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmittingReview(true)
    setReviewError('')
    try {
      const res = await api.post(`/products/${id}/reviews`, { rating, comment })
      setProduct((prev) => ({
        ...prev,
        reviews: [res.data, ...(prev.reviews || [])],
        reviewCount: (prev.reviewCount || 0) + 1,
      }))
      setComment('')
      setRating(5)
    } catch (err) {
      setReviewError(err.response?.data?.error || 'No se pudo enviar la reseña')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-slate-500">
        Cargando producto...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          Producto no encontrado
        </p>
        <Link to="/" className="inline-flex items-center gap-2 mt-4 text-primary-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean)
  const discount =
    product.listPrice && product.listPrice > product.price
      ? Math.round(((product.listPrice - product.price) / product.listPrice) * 100)
      : 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al catálogo
      </Link>

      {/* Producto principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        {/* Galería de fotos */}
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <img
              src={activeImage || '/assets/products/placeholder.svg'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImage === img
                      ? 'border-primary-600'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información */}
        <div className="flex flex-col">
          {product.category && (
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">
              {product.category.name}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mt-2 text-sm">
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(product.averageRating || 0) ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-slate-500 dark:text-slate-400">
              {product.reviewCount > 0
                ? `${product.averageRating} (${product.reviewCount} reseña${product.reviewCount === 1 ? '' : 's'})`
                : 'Sin reseñas aún'}
            </span>
          </div>

          <div className="mt-6 pb-6 border-b border-slate-200 dark:border-slate-800">
            {product.listPrice && product.listPrice > product.price && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base text-slate-400 line-through">
                  ${Number(product.listPrice).toLocaleString('es-AR')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  {discount}% OFF
                </span>
              </div>
            )}
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              ${Number(product.price).toLocaleString('es-AR')} <span className="text-sm font-normal text-slate-500">ARS</span>
            </p>
          </div>

          <div className="py-6 flex-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Descripción
            </h2>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3.5 py-2.5 text-lg font-semibold hover:text-primary-600"
              >
                -
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3.5 py-2.5 text-lg font-semibold hover:text-primary-600"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => addItem(product, quantity)}
              className="flex-1 py-3 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <ShoppingCart className="w-5 h-5" />
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>

      {/* Sección de comentarios y reseñas */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Reseñas y Comentarios ({product.reviews?.length || 0})
        </h2>

        {user ? (
          <form onSubmit={handleReviewSubmit} className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Tu calificación:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-5 h-5 transition-colors ${
                        s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Contanos tu experiencia con este producto..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
            />

            {reviewError && <p className="text-xs text-red-500">{reviewError}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingReview}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold"
              >
                {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publicar reseña
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">
              Iniciá sesión
            </Link>{' '}
            para dejar una reseña sobre este producto.
          </div>
        )}

        {/* Listado de reseñas */}
        <div className="space-y-4">
          {!product.reviews || product.reviews.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Todavía no hay reseñas. ¡Sé la primera persona en opinar!
            </p>
          ) : (
            product.reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">
                    {rev.user?.name || 'Usuario'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(rev.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
