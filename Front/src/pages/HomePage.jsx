import { useEffect, useState, useCallback } from 'react'
import { LayoutGrid, List, Plus, ShoppingCart, Star, Trash2 } from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import FilterSidebar from '../components/FilterSidebar'
import AddProductModal from '../components/AddProductModal'

export default function HomePage({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) {
  const { isAdmin } = useAuth()
  const { addItem } = useCart()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [onSaleOnly, setOnSaleOnly] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [addModalOpen, setAddModalOpen] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (searchQuery) params.search = searchQuery
      if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (onSaleOnly) params.onSale = 'true'
      if (sortBy) params.sort = sortBy

      const res = await api.get('/products', { params })
      setProducts(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Error cargando productos:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, minPrice, maxPrice, onSaleOnly, sortBy])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 200)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  function handleResetFilters() {
    onSelectCategory('all')
    onSearchChange('')
    setMinPrice('')
    setMaxPrice('')
    setOnSaleOnly(false)
    setSortBy('newest')
  }

  async function handleDeleteProduct(e, id) {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('¿Eliminar este producto del catálogo?')) return
    try {
      await api.delete(`/products/${id}`)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert(err.response?.data?.error || 'No se pudo eliminar el producto')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Barra lateral de filtros */}
        <FilterSidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          onSaleOnly={onSaleOnly}
          onSaleOnlyChange={setOnSaleOnly}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onReset={handleResetFilters}
        />

        {/* Contenido principal */}
        <main className="flex-1 min-w-0">
          {/* Toolbar superior del catálogo */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Catálogo de Productos
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {loading ? 'Cargando...' : `${products.length} producto${products.length === 1 ? '' : 's'} encontrado${products.length === 1 ? '' : 's'}`}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Botón + Agregar Producto (Solo ADMIN / DIRECTORA) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Producto
                </button>
              )}

              {/* Selector de vista Cuadrícula / Listado */}
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Vista en cuadrícula"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Vista en listado"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Lista / Cuadrícula de productos */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-80 rounded-2xl border border-mz-border dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-mz-border dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard p-12 text-center">
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                No se encontraron productos con los filtros seleccionados.
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setAddModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Agregar el primer producto
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((product) => {
                const discount =
                  product.listPrice && product.listPrice > product.price
                    ? Math.round(((product.listPrice - product.price) / product.listPrice) * 100)
                    : 0

                return (
                  <div
                    key={product.id}
                    className="group rounded-2xl border border-mz-border dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    <a
                      href={`/producto/${product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden"
                    >
                      <img
                        src={product.imageUrl || '/assets/products/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {discount > 0 && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow">
                          {discount}% OFF
                        </span>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProduct(e, product.id)}
                          title="Eliminar producto"
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 text-red-600 hover:bg-red-600 hover:text-white transition-colors shadow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </a>

                    <div className="p-4 flex-1 flex flex-col">
                      {product.category && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 mb-1">
                          {product.category.name}
                        </span>
                      )}
                      <a
                        href={`/producto/${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-slate-900 dark:text-white hover:text-primary-600 transition-colors line-clamp-2"
                      >
                        {product.name}
                      </a>

                      {product.reviewCount > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="font-semibold">{product.averageRating}</span>
                          <span className="text-slate-400">({product.reviewCount})</span>
                        </div>
                      )}

                      <div className="mt-auto pt-3">
                        {product.listPrice && product.listPrice > product.price && (
                          <p className="text-xs text-slate-400 line-through">
                            ${Number(product.listPrice).toLocaleString('es-AR')}
                          </p>
                        )}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            ${Number(product.price).toLocaleString('es-AR')}
                          </p>
                          <button
                            type="button"
                            onClick={() => addItem(product, 1)}
                            className="p-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                            title="Agregar al carrito"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Vista en Listado */
            <div className="space-y-3">
              {products.map((product) => {
                const discount =
                  product.listPrice && product.listPrice > product.price
                    ? Math.round(((product.listPrice - product.price) / product.listPrice) * 100)
                    : 0

                return (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-mz-border dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4"
                  >
                    <a
                      href={`/producto/${product.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full sm:w-32 h-32 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0"
                    >
                      <img
                        src={product.imageUrl || '/assets/products/placeholder.svg'}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {discount > 0 && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                          {discount}% OFF
                        </span>
                      )}
                    </a>

                    <div className="flex-1 min-w-0">
                      {product.category && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">
                          {product.category.name}
                        </span>
                      )}
                      <a
                        href={`/producto/${product.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-base font-bold text-slate-900 dark:text-white hover:text-primary-600 transition-colors mt-0.5"
                      >
                        {product.name}
                      </a>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                      <div className="sm:text-right">
                        {product.listPrice && product.listPrice > product.price && (
                          <p className="text-xs text-slate-400 line-through">
                            ${Number(product.listPrice).toLocaleString('es-AR')}
                          </p>
                        )}
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                          ${Number(product.price).toLocaleString('es-AR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => addItem(product, 1)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Agregar
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProduct(e, product.id)}
                            title="Eliminar producto"
                            className="p-2 rounded-xl border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal Agregar Producto */}
      <AddProductModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        categories={categories}
        onCreated={() => fetchProducts()}
      />
    </div>
  )
}
