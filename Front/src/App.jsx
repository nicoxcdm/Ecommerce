import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import HomePage from './pages/HomePage'
import ProductDetailPage from './pages/ProductDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import api from './services/api'

const FALLBACK_CATEGORIES = [
  { id: 'laboratorios', name: 'Laboratorios', slug: 'laboratorios' },
  { id: 'aparatologia', name: 'Aparatología', slug: 'aparatologia' },
  { id: 'cosmeticos', name: 'Cosméticos', slug: 'cosmeticos' },
  { id: 'cuidado-corporal', name: 'Cuidado Corporal', slug: 'cuidado-corporal' },
  { id: 'cuidado-facial', name: 'Cuidado Facial', slug: 'cuidado-facial' },
  { id: 'insumos', name: 'Insumos', slug: 'insumos' },
]

function AppContent() {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    api
      .get('/categories')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            }
          />
          <Route path="/producto/:id" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Routes>
      </div>

      <CartDrawer />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
