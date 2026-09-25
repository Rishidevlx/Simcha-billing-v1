import { useState, useRef, useEffect } from 'react'
import LottieAnimation from '../components/ui/LottieAnimation'
import {
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  X,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Clock,
  RotateCcw
} from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Checkbox from '../components/ui/Checkbox'
import logoImg from '../assets/Logo/Logo-bg-remove.webp'
import growthAnimation from '../assets/lottiefiles/growth-software.json'
import { API_ENDPOINTS } from '../config/api'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // -------------------------------------------------------------
  // FORGOT PASSWORD MODAL STATE
  // -------------------------------------------------------------
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1) // 1: Email, 2: OTP, 3: Success
  const [forgotEmail, setForgotEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  const otpInputRefs = useRef([])

  // Resend OTP countdown timer
  useEffect(() => {
    let timer
    if (showForgotModal && forgotStep === 2 && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [showForgotModal, forgotStep, resendCountdown])

  const openForgotModal = () => {
    setForgotEmail(email || '')
    setForgotStep(1)
    setOtpDigits(['', '', '', '', '', ''])
    setForgotError('')
    setShowForgotModal(true)
  }

  const closeForgotModal = () => {
    setShowForgotModal(false)
    setForgotStep(1)
    setForgotError('')
    setOtpDigits(['', '', '', '', '', ''])
    setForgotLoading(false)
  }

  // Step 1: Send OTP to email
  const handleSendOtp = async (e) => {
    e?.preventDefault()
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.')
      return
    }

    setForgotLoading(true)
    setForgotError('')

    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send verification code.')
      }

      setForgotStep(2)
      setResendCountdown(60)
      setCanResend(false)
      setOtpDigits(['', '', '', '', '', ''])
      setTimeout(() => {
        otpInputRefs.current[0]?.focus()
      }, 100)
    } catch (err) {
      setForgotError(err.message || 'Unable to send code. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  // Handle individual OTP digit inputs
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otpDigits]
    newOtp[index] = value.slice(-1)
    setOtpDigits(newOtp)
    setForgotError('')

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6)
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6)
      setOtpDigits(newOtp)
      otpInputRefs.current[Math.min(pastedData.length, 5)]?.focus()
    }
  }

  // Step 2: Verify OTP & Send Reset Link
  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    const fullOtp = otpDigits.join('')

    if (fullOtp.length < 6) {
      setForgotError('Please enter the complete 6-digit code.')
      return
    }

    setForgotLoading(true)
    setForgotError('')

    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: fullOtp
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Verification failed. Please try again.')
      }

      setForgotStep(3)
    } catch (err) {
      setForgotError(err.message || 'Invalid verification code.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login failed. Please check your credentials.')
      }

      // Success
      if (onLogin) {
        onLogin(data.user, data.token, rememberMe)
      }
    } catch (err) {
      console.error('Login error:', err)
      setErrorMsg(err.message || 'Unable to connect to server. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col lg:flex-row bg-[#FFFFFF] font-['Poppins',sans-serif]">

      {/* Left Section: Deep Navy Blue Branding with Centered Lottie Animation */}
      <section className="hidden lg:flex w-1/2 h-full bg-[#043486] items-center justify-center p-8 lg:p-14 relative overflow-hidden text-white">
        {/* Subtle Ambient Glow Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#0248BC]/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        {/* Centered Lottie Animation */}
        <div className="w-full max-w-[560px] xl:max-w-[620px] flex items-center justify-center relative z-10">
          <LottieAnimation
            animationData={growthAnimation}
            loop={true}
            className="w-full h-auto drop-shadow-2xl"
          />
        </div>
      </section>

      {/* Right Section: Form + Large Top-Right Logo */}
      <section className="w-full lg:w-1/2 h-full bg-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 overflow-hidden">

        {/* Top: Large Right-side Logo */}
        <div className="w-full flex justify-end">
          <img
            src={logoImg}
            alt="Simcha Logo"
            className="h-16 sm:h-20 lg:h-24 w-auto object-contain transition-transform hover:scale-105 duration-200"
          />
        </div>

        {/* Center: Login Form */}
        <div className="w-full max-w-md mx-auto my-auto py-2">

          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#292424] tracking-tight">
              Welcome Back
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 font-normal">
              Please enter your credentials to login to Simcha Billing.
            </p>
          </div>

          {/* Error message alert */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div>
              <Input
                label="Email"
                icon={User}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@simcha.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <Input
                label="Password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-1">
              <Checkbox
                label="Remember me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <button
                type="button"
                onClick={openForgotModal}
                className="text-xs font-semibold text-[#043486] hover:text-blue-700 hover:underline transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Primary Login Button */}
            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-3 !bg-[#043486] hover:!bg-[#0248BC] text-white font-semibold py-3.5 shadow-md shadow-blue-950/15"
            >
              Login
            </Button>
          </form>

        </div>

        {/* Bottom Footer Text */}
        <div className="w-full text-center text-[11px] sm:text-xs text-gray-400 pt-2">
          © {new Date().getFullYear()} Simcha Billing System. All rights reserved.
        </div>

      </section>

      {/* ------------------------------------------------------------- */}
      {/* FORGOT PASSWORD MINIMALIST MODAL POPUP */}
      {/* ------------------------------------------------------------- */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl max-w-sm w-full p-6 relative">
            
            {/* Close button */}
            <button
              type="button"
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            {/* Error Banner */}
            {forgotError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-red-500" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* STEP 1: ENTER EMAIL */}
            {forgotStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4 text-left">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    Reset password
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#043486] focus:ring-3 focus:ring-blue-500/10 transition-all placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full py-2.5 bg-[#043486] hover:bg-[#032b6d] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending Code...</span>
                      </>
                    ) : (
                      <span>Send OTP</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: ENTER 6-DIGIT OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    Enter OTP
                  </h2>
                  <span className="text-xs text-gray-500 block truncate font-medium mt-0.5">
                    Code sent to <strong className="text-gray-800">{forgotEmail}</strong>
                  </span>
                </div>

                {/* 6 Digit Input Boxes */}
                <div className="flex justify-between gap-1.5 pt-1" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-lg font-bold text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-[#043486] focus:ring-3 focus:ring-blue-500/10 transition-all"
                    />
                  ))}
                </div>

                {/* Resend Countdown */}
                <div className="text-xs text-gray-500 flex items-center justify-between pt-1">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={forgotLoading}
                      className="text-xs font-semibold text-[#043486] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={12} /> Resend OTP
                    </button>
                  ) : (
                    <span className="text-gray-400 font-mono flex items-center gap-1">
                      <Clock size={12} /> Resend in 00:{resendCountdown.toString().padStart(2, '0')}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    Change email
                  </button>
                </div>

                {/* Verify Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={forgotLoading || otpDigits.join('').length < 6}
                    className="w-full py-2.5 bg-[#043486] hover:bg-[#032b6d] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <span>Verify &amp; Send Link</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS VIEW */}
            {forgotStep === 3 && (
              <div className="py-2 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 size={24} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Reset link sent
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    A 15-minute password reset link has been dispatched to your email.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={closeForgotModal}
                    className="w-full py-2.5 bg-[#043486] hover:bg-[#032b6d] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </main>
  )
}

