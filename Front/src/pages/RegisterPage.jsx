import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, UserPlus, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register, verifyEmail } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState('form') // 'form' | 'verify'
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    password: '',
    confirmPassword: '',
    pais: 'Argentina',
  })
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      setStep('verify')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyEmail(form.email, code)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {step === 'form' ? 'Crear cuenta' : 'Verificar correo'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {step === 'form'
              ? 'Tu cuenta servirá para el E-Commerce y la Plataforma MZ'
              : `Ingresá el código de 6 dígitos enviado a ${form.email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                DNI
              </label>
              <input
                type="text"
                required
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Registrarse
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              className="w-full text-center tracking-[0.5em] text-2xl font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Verificar cuenta
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
