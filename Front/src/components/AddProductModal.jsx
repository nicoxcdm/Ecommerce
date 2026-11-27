import { useState } from 'react'
import { X, Plus, Image as ImageIcon, Loader2 } from 'lucide-react'
import api from '../services/api'

export default function AddProductModal({ isOpen, onClose, categories = [], onCreated }) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [listPrice, setListPrice] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('/assets/products/placeholder.svg')
  const [extraImages, setExtraImages] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const images = extraImages
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean)

      const res = await api.post('/products', {
        name,
        categoryId: categoryId || null,
        price: Number(price),
        listPrice: listPrice ? Number(listPrice) : null,
        description,
        imageUrl: imageUrl.trim() || '/assets/products/placeholder.svg',
        images,
      })

      setName('')
      setCategoryId('')
      setPrice('')
      setListPrice('')
      setDescription('')
      setImageUrl('/assets/products/placeholder.svg')
      setExtraImages('')
      if (onCreated) onCreated(res.data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el producto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary-600" />
            Agregar Producto
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nombre del producto *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Radiofrecuencia Tripolar Profesional"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Precio (ARS) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="45000"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Precio de lista (opcional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                placeholder="55000"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Descripción *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Características, modo de uso, certificaciones..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-primary-600" />
              Foto principal (ruta de asset en /public/assets/products/)
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/assets/products/mi-producto.jpg"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Guardá las imágenes en <code>Front/public/assets/products/</code> para que no ocupen espacio en la BD ni en el backend.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fotos adicionales (opcional, separadas por coma)
            </label>
            <input
              type="text"
              value={extraImages}
              onChange={(e) => setExtraImages(e.target.value)}
              placeholder="/assets/products/foto2.jpg, /assets/products/foto3.jpg"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Guardar Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
