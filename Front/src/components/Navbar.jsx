import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  ShoppingCart,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  LayoutGrid,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar({
  categories = [],
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) {
  const { isDark, toggle } = useTheme()
  const { user, isAdmin, logout } = useAuth()
  const { totalCount, setIsOpen } = useCart()
  const navigate = useNavigate()

  const [catOpen, setCatOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const catRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleCategoryClick(catId) {
    if (onSelectCategory) onSelectCategory(catId)
    setCatOpen(false)
    navigate('/')
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#967e55] dark:border-mz-darkBorder bg-[#ad9468] dark:bg-mz-darkCard/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Izquierda: Logo + Desplegable de Categorías */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/assets/logo-mz.png"
              alt="Marcela Zelaya"
              className="h-9 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <span className="hidden sm:inline font-bold text-white dark:text-mz-peachLight tracking-tight">
              Tienda MZ
            </span>
          </Link>

          <div className="relative" ref={catRef}>
            <button
              type="button"
              onClick={() => setCatOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold rounded-lg border border-mz-peach dark:border-mz-darkBorder bg-white/80 dark:bg-mz-darkSurface text-mz-heading dark:text-mz-peachLight hover:bg-white dark:hover:bg-mz-darkBorder transition-colors"
            >
              <LayoutGrid className="w-4 h-4 text-primary-600 dark:text-mz-peach" />
              <span className="hidden md:inline">Categorías</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
            </button>

            {catOpen && (
              <div className="absolute left-0 mt-2 w-56 rounded-xl border border-mz-border dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard shadow-lg py-1.5 z-50">
                <button
                  type="button"
                  onClick={() => handleCategoryClick('all')}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-mz-cream dark:hover:bg-mz-darkSurface ${
                    selectedCategory === 'all'
                      ? 'text-primary-600 dark:text-mz-peach font-semibold'
                      : 'text-mz-text dark:text-mz-peachLight'
                  }`}
                >
                  <span>Todas las categorías</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(String(cat.id))}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-mz-cream dark:hover:bg-mz-darkSurface ${
                      String(selectedCategory) === String(cat.id)
                        ? 'text-primary-600 dark:text-mz-peach font-semibold'
                        : 'text-mz-text dark:text-mz-peachLight'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {typeof cat.productCount === 'number' && (
                      <span className="text-xs text-mz-muted/60 dark:text-mz-peach/60">{cat.productCount}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Centro: Barra de búsqueda */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-mz-muted/60 dark:text-mz-peach/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Buscar aparatología, cosméticos, laboratorio, insumos..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-mz-peach dark:border-mz-darkBorder bg-white/90 dark:bg-mz-darkSurface text-mz-text dark:text-mz-cream placeholder:text-mz-muted/60 dark:placeholder:text-mz-peach/50 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent"
            />
          </div>
        </form>

        {/* Derecha: Tema + Carrito + Sesión */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Botón Tema Oscuro / Claro */}
          <button
            type="button"
            onClick={toggle}
            title={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            className="p-2 rounded-lg border border-mz-peach dark:border-mz-darkBorder bg-white/80 dark:bg-mz-darkSurface text-mz-heading dark:text-mz-peachLight hover:bg-white dark:hover:bg-mz-darkBorder transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-mz-heading" />}
          </button>

          {/* Carrito */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            title="Ver carrito"
            className="relative p-2 rounded-lg border border-mz-peach dark:border-mz-darkBorder bg-white/80 dark:bg-mz-darkSurface text-mz-heading dark:text-mz-peachLight hover:bg-white dark:hover:bg-mz-darkBorder transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            {totalCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-primary-600 text-white text-[11px] font-bold flex items-center justify-center">
                {totalCount}
              </span>
            )}
          </button>

          {/* Usuario / Iniciar sesión */}
          {user ? (
            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-mz-peach dark:border-mz-darkBorder bg-white/80 dark:bg-mz-darkSurface text-sm font-medium text-mz-heading dark:text-mz-peachLight hover:bg-white dark:hover:bg-mz-darkBorder transition-colors"
              >
                {isAdmin ? (
                  <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-mz-peach shrink-0" />
                ) : (
                  <User className="w-4 h-4 text-mz-muted shrink-0" />
                )}
                <span className="max-w-[120px] truncate hidden sm:inline">{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-mz-muted" />
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-mz-border dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-mz-border dark:border-mz-darkBorder">
                    <p className="text-sm font-semibold text-mz-heading dark:text-mz-cream truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-mz-muted dark:text-mz-peach/70 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-mz-peachLight dark:bg-primary-900/60 text-primary-700 dark:text-mz-peachLight">
                      {isAdmin ? `${user.role} (Admin Tienda)` : 'Cliente'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setUserOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
