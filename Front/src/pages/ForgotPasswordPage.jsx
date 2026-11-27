import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, KeyRound, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import api from '../services/api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('request') // 'request' | 'reset'
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  async function handleRequest(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      setStep('reset')
      setSuccessMsg('Se envió un código de 6 dígitos a tu correo.')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar el código de recuperación')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      })
      navigate('/login', { state: { passwordReset: true } })
    } catch (err) {
      setError(err.response?.data?.error || 'Código inválido o expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-mz-border dark:border-mz-darkBorder bg-white dark:bg-mz-darkCard p-8 shadow-sm">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al inicio de sesión
        </Link>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {step === 'request'
              ? 'Te enviaremos un código de 6 dígitos a tu correo'
              : `Ingresá el código enviado a ${email}`}
          </p>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-300">
            {successMsg}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-xl border border-slate-200 dark:border-mz-darkBorder bg-slate-50 dark:bg-mz-darkSurface px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Enviar código
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Código de 6 dígitos
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="w-full text-center tracking-[0.4em] text-xl font-bold rounded-xl border border-slate-200 dark:border-mz-darkBorder bg-slate-50 dark:bg-mz-darkSurface px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 dark:border-mz-darkBorder bg-slate-50 dark:bg-mz-darkSurface pl-3.5 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 dark:border-mz-darkBorder bg-slate-50 dark:bg-mz-darkSurface px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Cambiar contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
