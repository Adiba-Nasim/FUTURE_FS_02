import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ZONES } from '../utils/constants'
import './Auth.css'

// ─── Validators ───────────────────────────────────────────────────────────────
const validators = {
  name:      v => v.trim() ? null : 'Full name is required.',
  email:     v => !v.trim() ? 'Email is required.'
                : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
                  ? 'Enter a valid email address.'
                  : null,
  password:  v => !v ? 'Password is required.'
                : v.length < 6 ? 'Password must be at least 6 characters.'
                : null,
  mobile_no: v => {
    if (!v.trim()) return 'Mobile number is required.'
    const digits = v.replace(/\D/g, '') 
    if (!/^(91)?[6-9]\d{9}$/.test(digits))
      return 'Enter a valid 10-digit Indian mobile number.'
    return null
  },
  zone:      v => v ? null : 'Please select your zone.',
}

function validate(form, isSignUp) {
  const errors = {}
  const always = ['email', 'password']
  const signUpOnly = ['name', 'mobile_no', 'zone']
  const fields = isSignUp ? [...always, ...signUpOnly] : always

  fields.forEach(field => {
    const err = validators[field]?.(form[field])
    if (err) errors[field] = err
  })
  return errors
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Auth() {
  const navigate = useNavigate()
  const { loading, signIn, signUp } = useAuthStore()

  const [isSignUp, setIsSignUp] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'customer', mobile_no: '', zone: ''
  })
  const [touched, setTouched] = useState({})   // tracks which fields have been visited
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getError = field => touched[field] ? fieldErrors[field] : null

  const handleChange = (e) => {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)
    setSubmitError(null)

    // Re-validate this field live once it has been touched
    if (touched[name]) {
      const err = validators[name]?.(value)
      setFieldErrors(prev => ({ ...prev, [name]: err || undefined }))
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const err = validators[name]?.(value)
    setFieldErrors(prev => ({ ...prev, [name]: err || undefined }))
  }

  const handleRoleSelect = (role) => {
    setForm(prev => ({ ...prev, role }))
  }

  const handleSubmit = async () => {
    // Mark all relevant fields as touched
    const fields = isSignUp
      ? ['email', 'password', 'name', 'mobile_no', 'zone']
      : ['email', 'password']
    setTouched(Object.fromEntries(fields.map(f => [f, true])))

    const errors = validate(form, isSignUp)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const result = isSignUp
      ? await signUp(
          form.email.trim().toLowerCase(),
          form.password,
          form.name.trim(),
          form.role,
          form.mobile_no.trim(),
          form.zone
        )
      : await signIn(form.email.trim().toLowerCase(), form.password)

    if (result.success) {
      const userRole = result.role || form.role
      if (userRole === 'cook')          navigate('/cook/dashboard')
      else if (userRole === 'delivery') navigate('/delivery/dashboard')
      else if (userRole === 'admin')    navigate('/admin')
      else                              navigate('/')
    } else {
      setSubmitError(result.error)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit() }

  const switchTab = (signup) => {
    setIsSignUp(signup)
    setFieldErrors({})
    setTouched({})
    setSubmitError(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <Link to="/" className="auth-logo">
            <div className="auth-logo-circle">M</div>
            <div className="auth-logo-text">
              <span className="auth-logo-name">Mother's Touch</span>
              <span className="auth-logo-sub">Tiffin</span>
            </div>
          </Link>
          <div className="auth-left-body">
            <h1 className="auth-left-headline">Food that feels<br /><em>like home.</em></h1>
            <p className="auth-left-desc">
              Homecooked meals with the touch of motherly love. Delivered fresh to your door,
              packed in banana leaf, priced for everyone.
            </p>
            <div className="auth-trust-pills">
              <span>🌿 Zero plastic</span>
              <span>👩‍🍳 30 home cooks</span>
              <span>⚡ 35 min delivery</span>
              <span>❤️ 200+ happy customers</span>
            </div>
          </div>
          <div className="auth-left-quote">
            "Every tiffin carries the love of a mother who<br />never had a stage — until now."
          </div>
        </div>
        <div className="auth-left-bg">
          <div className="auth-blob auth-blob-1"></div>
          <div className="auth-blob auth-blob-2"></div>
          <div className="auth-blob auth-blob-3"></div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2 className="auth-form-title">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="auth-form-sub">
              {isSignUp
                ? 'Join our community of home-cooked goodness'
                : 'Sign in to order your next tiffin'}
            </p>
          </div>

          <div className="auth-tab-row">
            <button
              className={!isSignUp ? 'auth-tab active' : 'auth-tab'}
              onClick={() => switchTab(false)}
            >Sign In</button>
            <button
              className={isSignUp ? 'auth-tab active' : 'auth-tab'}
              onClick={() => switchTab(true)}
            >Sign Up</button>
          </div>

          <div className="auth-fields">

            {/* Full Name — sign up only */}
            {isSignUp && (
              <div className={`auth-field${getError('name') ? ' auth-field--error' : ''}`}>
                <label className="auth-label">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Priya Sharma"
                  className="auth-input"
                  autoComplete="name"
                  aria-invalid={!!getError('name')}
                  aria-describedby={getError('name') ? 'err-name' : undefined}
                />
                {getError('name') && (
                  <span className="auth-field-error" id="err-name" role="alert">
                    ⚠️ {getError('name')}
                  </span>
                )}
              </div>
            )}

            {/* Email */}
            <div className={`auth-field${getError('email') ? ' auth-field--error' : ''}`}>
              <label className="auth-label">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                className="auth-input"
                autoComplete="email"
                aria-invalid={!!getError('email')}
                aria-describedby={getError('email') ? 'err-email' : undefined}
              />
              {getError('email') && (
                <span className="auth-field-error" id="err-email" role="alert">
                  ⚠️ {getError('email')}
                </span>
              )}
            </div>

            {/* Password */}
            <div className={`auth-field${getError('password') ? ' auth-field--error' : ''}`}>
              <label className="auth-label">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="auth-input"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                aria-invalid={!!getError('password')}
                aria-describedby={getError('password') ? 'err-password' : undefined}
              />
              {getError('password') && (
                <span className="auth-field-error" id="err-password" role="alert">
                  ⚠️ {getError('password')}
                </span>
              )}
            </div>

            {/* Role picker — sign up only */}
            {isSignUp && (
              <div className="auth-field">
                <label className="auth-label">I want to join as</label>
                <div className="auth-role-grid">
                  {[
                    { value: 'customer', label: 'Customer',    desc: 'Order tiffins' },
                    { value: 'cook',     label: 'Home Cook',   desc: 'Cook & earn' },
                    { value: 'delivery', label: 'Delivery',    desc: 'Deliver & earn' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={form.role === opt.value ? 'auth-role-card selected' : 'auth-role-card'}
                      onClick={() => handleRoleSelect(opt.value)}
                    >
                      <span className="auth-role-label">{opt.label}</span>
                      <span className="auth-role-desc">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile + Zone — sign up only */}
            {isSignUp && (
              <div className="auth-field-row">
                <div className={`auth-field${getError('mobile_no') ? ' auth-field--error' : ''}`}>
                  <label className="auth-label">Mobile Number</label>
                  <input
                    name="mobile_no"
                    type="tel"
                    value={form.mobile_no}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={(e) => {
                      const allowed = ['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+']
                      if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) e.preventDefault()
                    }}
                    placeholder="+91 98765 43210"
                    maxLength={10}
                    className="auth-input"
                    autoComplete="tel"
                    aria-invalid={!!getError('mobile_no')}
                    aria-describedby={getError('mobile_no') ? 'err-mobile' : undefined}
                  />
                  {getError('mobile_no') && (
                    <span className="auth-field-error" id="err-mobile" role="alert">
                      ⚠️ {getError('mobile_no')}
                    </span>
                  )}
                </div>

                <div className={`auth-field${getError('zone') ? ' auth-field--error' : ''}`}>
                  <label className="auth-label">Your Zone</label>
                  <select
                    name="zone"
                    value={form.zone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="auth-input"
                    aria-invalid={!!getError('zone')}
                    aria-describedby={getError('zone') ? 'err-zone' : undefined}
                  >
                    <option value="">Select zone</option>
                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                  {getError('zone') && (
                    <span className="auth-field-error" id="err-zone" role="alert">
                      ⚠️ {getError('zone')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Server / API error */}
            {submitError && (
              <div className="auth-error" role="alert">
                <span>⚠️</span> {submitError}
              </div>
            )}

            <button
              className="auth-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Please wait…' : isSignUp ? 'Create Account →' : 'Sign In →'}
            </button>
          </div>

          <p className="auth-back"><Link to="/">← Back to home</Link></p>
        </div>
      </div>
    </div>
  )
}