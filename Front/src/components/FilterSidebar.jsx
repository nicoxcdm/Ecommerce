import { SlidersHorizontal, RotateCcw } from 'lucide-react'

export default function FilterSidebar({
  categories = [],
  selectedCategory,
  onSelectCategory,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  onSaleOnly,
  onSaleOnlyChange,
  sortBy,
  onSortChange,
  onReset,
}) {
  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-6">
      <div className="rounded-2xl border border-[#967e55] dark:border-mz-darkBorder bg-[#ad9468] dark:bg-mz-darkCard p-5 shadow-sm text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white dark:text-mz-peachLight flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-white dark:text-mz-peach" />
            Filtros
          </h2>
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-white/85 hover:text-white dark:text-mz-peach/70 dark:hover:text-mz-peach flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar
          </button>
        </div>

        {/* Ordenar por */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-white/90 dark:text-mz-peach/80 mb-2">
            Ordenar por
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full rounded-lg border border-[#967e55] dark:border-mz-darkBorder bg-white dark:bg-mz-darkSurface px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            <option value="newest" className="text-black bg-white dark:text-white dark:bg-mz-darkSurface">Más recientes</option>
            <option value="price_asc" className="text-black bg-white dark:text-white dark:bg-mz-darkSurface">Menor precio</option>
            <option value="price_desc" className="text-black bg-white dark:text-white dark:bg-mz-darkSurface">Mayor precio</option>
            <option value="rating_desc" className="text-black bg-white dark:text-white dark:bg-mz-darkSurface">Mejor valorados</option>
            <option value="name_asc" className="text-black bg-white dark:text-white dark:bg-mz-darkSurface">Nombre (A-Z)</option>
          </select>
        </div>

        {/* Categorías */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider text-white dark:text-mz-peachLight mb-2">
            Categorías
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onSelectCategory('all')}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#2B1E1A] text-white'
                  : 'text-white dark:text-mz-peachLight hover:bg-white/15 dark:hover:bg-mz-darkSurface'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(String(cat.id))}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-bold flex items-center justify-between transition-colors ${
                  String(selectedCategory) === String(cat.id)
                    ? 'bg-[#2B1E1A] text-white'
                    : 'text-white dark:text-mz-peachLight hover:bg-white/15 dark:hover:bg-mz-darkSurface'
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {typeof cat.productCount === 'number' && (
                  <span
                    className={`text-xs ${
                      String(selectedCategory) === String(cat.id)
                        ? 'text-white/80'
                        : 'text-white/70 dark:text-mz-peach/60'
                    }`}
                  >
                    {cat.productCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Rango de precio */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-white/90 dark:text-mz-peach/80 mb-2">
            Precio (ARS)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              placeholder="Mínimo"
              value={minPrice}
              onChange={(e) => onMinPriceChange(e.target.value)}
              className="w-full rounded-lg border border-[#967e55] dark:border-mz-darkBorder bg-white dark:bg-mz-darkSurface px-2.5 py-1.5 text-sm text-black dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
            <input
              type="number"
              min="0"
              placeholder="Máximo"
              value={maxPrice}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              className="w-full rounded-lg border border-[#967e55] dark:border-mz-darkBorder bg-white dark:bg-mz-darkSurface px-2.5 py-1.5 text-sm text-black dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
        </div>

        {/* Solo en oferta */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onSaleOnly}
            onChange={(e) => onSaleOnlyChange(e.target.checked)}
            className="w-4 h-4 rounded border-white/60 text-[#2B1E1A] focus:ring-white"
          />
          <span className="text-sm text-white dark:text-mz-peachLight">
            Solo productos en oferta
          </span>
        </label>
      </div>
    </aside>
  )
}
