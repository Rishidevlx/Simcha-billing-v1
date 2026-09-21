import { useState } from 'react'
import LottieAnimation from '../components/ui/LottieAnimation'
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Checkbox from '../components/ui/Checkbox'
import logoImg from '../assets/Logo/Logo-bg-remove.png'
import growthAnimation from '../assets/lottiefiles/growth-software.json'
import { API_ENDPOINTS } from '../config/api'

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@simcha.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

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

            {/* Admin Checkbox & Forgotten Password */}
            <div className="flex items-center justify-between pt-1">
              <Checkbox
                label="Remember me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              <a
                href="#forgot-password"
                className="text-xs sm:text-sm font-medium text-gray-600 hover:text-[#043486] hover:underline transition-colors"
              >
                Forgotten password?
              </a>
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

    </main>
  )
}
