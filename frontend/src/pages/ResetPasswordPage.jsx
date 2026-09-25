import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  User
} from 'lucide-react'
import Swal from 'sweetalert2'
import logoImage from '../assets/Logo/Logo-bg-remove.webp'
import resetIllustration from '../assets/reset_illustration.png'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token') || ''
  const emailParam = searchParams.get('email') || ''

  // Verification & State
  const [isVerifying, setIsVerifying] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  const [userInfo, setUserInfo] = useState({ name: '', email: '', role: '' })

  // Countdown Timer in Seconds
  const [timeLeft, setTimeLeft] = useState(0)

  // Form Fields
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 1. Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsVerifying(false)
        setIsTokenValid(false)
        setErrorMessage('No password setup token provided. Please use the link sent to your email.')
        return
      }

      try {
        const query = new URLSearchParams({ token, email: emailParam }).toString()
        const res = await fetch(`/api/auth/verify-reset-token?${query}`)
        const data = await res.json()

        if (data.success && data.valid) {
          setIsTokenValid(true)
          setUserInfo({
            name: data.name || 'User',
            email: data.email || emailParam,
            role: data.role || 'Operator'
          })
          setTimeLeft(data.remainingSeconds > 0 ? data.remainingSeconds : 0)
        } else {
          setIsTokenValid(false)
          setIsExpired(Boolean(data.expired))
          setErrorMessage(data.message || 'This password setup link is invalid or has expired.')
        }
      } catch (err) {
        console.error('Failed to verify token:', err)
        setIsTokenValid(false)
        setErrorMessage('Network error while verifying link. Please check your connection.')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token, emailParam])

  // 2. Active Countdown Clock
  useEffect(() => {
    if (!isTokenValid || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsTokenValid(false)
          setIsExpired(true)
          setErrorMessage('Your 15-minute password setup window has expired. Please contact your administrator.')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isTokenValid, timeLeft])

  // Helper: Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Password Strength Calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: '', barColor: '' }
    let score = 0
    if (pass.length >= 6) score += 1
    if (pass.length >= 8) score += 1
    if (/[A-Z]/.test(pass)) score += 1
    if (/[0-9]/.test(pass)) score += 1
    if (/[^A-Za-z0-9]/.test(pass)) score += 1

    if (score <= 2) return { score: 1, label: 'Weak', color: 'text-rose-500', barColor: 'bg-rose-500' }
    if (score <= 4) return { score: 2, label: 'Moderate', color: 'text-amber-500', barColor: 'bg-amber-500' }
    return { score: 3, label: 'Strong', color: 'text-emerald-500', barColor: 'bg-emerald-500' }
  }

  const strength = getPasswordStrength(newPassword)

  // 3. Submit New Password
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!newPassword || newPassword.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Weak Password',
        text: 'Password must be at least 6 characters long.',
        confirmButtonColor: '#043486'
      })
      return
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Password Mismatch',
        text: 'New password and confirm password do not match.',
        confirmButtonColor: '#043486'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: userInfo.email || emailParam,
          newPassword
        })
      })

      const data = await res.json()

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Password Set Successfully!',
          text: 'Your new login password has been saved securely. Redirecting to login...',
          timer: 2200,
          showConfirmButton: false
        })
        navigate('/login', { replace: true })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Setup Failed',
          text: data.message || 'Unable to update password.',
          confirmButtonColor: '#043486'
        })
      }
    } catch (err) {
      console.error('Password reset submit error:', err)
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Could not connect to the server. Please try again.',
        confirmButtonColor: '#043486'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-white text-gray-800 font-['Poppins',sans-serif] selection:bg-[#043486] selection:text-white">
      
      {/* 1. TOP HEADER BAR */}
      <header className="w-full px-4 sm:px-10 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
        
        {/* Left: Simcha Logo (Larger, No text branding) */}
        <div className="flex items-center">
          <img
            src={logoImage}
            alt="Simcha Logo"
            className="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105"
          />
        </div>

        {/* Right: Account & Expiry Info + Log In Link */}
        <div className="flex items-center flex-wrap gap-3 sm:gap-5 text-xs sm:text-sm">
          {isTokenValid && (
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs">
              <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                <User size={14} className="text-[#043486]" />
                <span className="text-gray-400 font-semibold hidden sm:inline">Account:</span>
                <span className="font-semibold text-gray-800 truncate max-w-[160px] sm:max-w-xs">
                  {userInfo.name} ({userInfo.email})
                </span>
              </div>

              <div className="h-4 w-[1px] bg-gray-200" />

              <div className="flex items-center gap-1">
                <span className="text-gray-400 font-semibold hidden sm:inline">Expires in:</span>
                <span
                  className={`font-mono font-bold flex items-center gap-1 ${
                    timeLeft < 180 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'
                  }`}
                >
                  <Clock size={12} />
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          )}

          <div className="text-gray-500 text-xs sm:text-sm">
            Already have credentials?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#043486] hover:text-blue-700 hover:underline transition-colors ml-0.5"
            >
              Log In
            </Link>
          </div>
        </div>

      </header>

      {/* 2. MAIN CENTER CONTENT */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto flex flex-col items-center text-center">
          
          {/* Signpost Illustration Image */}
          <div className="mb-4 flex items-center justify-center">
            <img
              src={resetIllustration}
              alt="Password Reset Illustration"
              className="w-48 sm:w-56 h-auto object-contain"
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-6">
            Set your password
          </h1>

          {/* LOADING STATE */}
          {isVerifying ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="animate-spin text-[#043486]" size={36} />
              <span className="text-xs font-semibold text-gray-500">Verifying secure setup link...</span>
            </div>
          ) : !isTokenValid ? (
            /* EXPIRED / INVALID LINK STATE */
            <div className="w-full bg-slate-50 border border-gray-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 border border-rose-200 rounded-full flex items-center justify-center mx-auto shadow-inner">
                {isExpired ? <Clock size={28} /> : <AlertTriangle size={28} />}
              </div>

              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-900">
                  {isExpired ? '15-Minute Setup Link Expired' : 'Invalid Setup Link'}
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
                  {errorMessage}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full py-3 bg-[#043486] hover:bg-[#0248BC] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back to Login</span>
                </Link>
              </div>
            </div>
          ) : (
            /* VALID ACTIVE FORM */
            <form onSubmit={handleSubmit} className="w-full text-left space-y-4">
              
              {/* New Password Field */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full px-4 py-3 text-xs sm:text-sm font-normal text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#043486] focus:ring-3 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="pt-1.5 space-y-1">
                    <div className="flex gap-1.5 h-1">
                      <div className={`flex-1 rounded-full ${strength.score >= 1 ? strength.barColor : 'bg-gray-100'}`} />
                      <div className={`flex-1 rounded-full ${strength.score >= 2 ? strength.barColor : 'bg-gray-100'}`} />
                      <div className={`flex-1 rounded-full ${strength.score >= 3 ? strength.barColor : 'bg-gray-100'}`} />
                    </div>
                    <span className={`text-[10px] font-semibold block text-right ${strength.color}`}>
                      Strength: {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-4 py-3 text-xs sm:text-sm font-normal text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#043486] focus:ring-3 focus:ring-blue-500/10 transition-all placeholder:text-gray-400 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {confirmPassword && newPassword !== confirmPassword && (
                  <span className="text-[11px] text-rose-500 font-medium pt-0.5 flex items-center gap-1">
                    <XCircle size={13} /> Passwords do not match
                  </span>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <span className="text-[11px] text-emerald-600 font-medium pt-0.5 flex items-center gap-1">
                    <CheckCircle2 size={13} /> Passwords match
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || (confirmPassword && newPassword !== confirmPassword)}
                  className="w-full py-3.5 bg-[#043486] hover:bg-[#032b6d] active:scale-[0.99] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm hover:shadow flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving Password...</span>
                    </>
                  ) : (
                    <span>Set &amp; Activate Password</span>
                  )}
                </button>
              </div>

              {/* Back to Login Link */}
              <div className="pt-3 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-[#043486] transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Login</span>
                </Link>
              </div>

              {/* Security Tag */}
              <div className="text-center pt-2">
                <span className="text-[11px] text-gray-400 inline-flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-500" /> Encrypted &amp; Secured with 256-bit BCrypt
                </span>
              </div>

            </form>
          )}

        </div>
      </main>

      {/* 3. FOOTER */}
      <footer className="w-full px-6 sm:px-12 py-4 flex items-center justify-center text-[11px] text-gray-400 border-t border-gray-100">
        <div>
          Copyright &copy; {new Date().getFullYear()} Simcha Info Solutions. All rights reserved.
        </div>
      </footer>

    </div>
  )
}


