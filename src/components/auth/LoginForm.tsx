import { AlertCircle, Loader2 } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { validateAdminEmail, validateAdminPassword } from '@/lib/authValidation'

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth()
  const reduceMotion = useReducedMotion()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [pending, setPending] = useState(false)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const showEmailError = (touched.email || submitted) && errors.email
  const showPasswordError = (touched.password || submitted) && errors.password

  function updateEmail(value: string) {
    setEmail(value)
    if (touched.email || submitted) {
      setErrors((current) => ({ ...current, email: validateAdminEmail(value) }))
    }
  }

  function updatePassword(value: string) {
    setPassword(value)
    if (touched.password || submitted) {
      setErrors((current) => ({ ...current, password: validateAdminPassword(value) }))
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return

    const nextErrors = {
      email: validateAdminEmail(email),
      password: validateAdminPassword(password),
    }
    setSubmitted(true)
    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) return

    setPending(true)
    setFormError('')
    try {
      await login({ email: email.trim(), password, remember })
      if (!reduceMotion) {
        await new Promise((resolve) => window.setTimeout(resolve, 120))
      }
      onSuccess()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Invalid email or password.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate aria-busy={pending}>
      {formError ? (
        <div
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="admin-email">
          Email address <span className="text-destructive" aria-hidden>*</span>
        </Label>
        <Input
          id="admin-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Enter your email address"
          value={email}
          disabled={pending}
          onChange={(event) => updateEmail(event.target.value)}
          onBlur={() => {
            setTouched((current) => ({ ...current, email: true }))
            setErrors((current) => ({ ...current, email: validateAdminEmail(email) }))
          }}
          aria-invalid={Boolean(showEmailError)}
          aria-describedby={showEmailError ? 'admin-email-error' : undefined}
          className="login-field h-10 bg-card dark:bg-card"
        />
        {showEmailError ? (
          <p id="admin-email-error" className="text-xs text-destructive" role="alert">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-password">
          Password <span className="text-destructive" aria-hidden>*</span>
        </Label>
        <PasswordInput
          id="admin-password"
          value={password}
          disabled={pending}
          invalid={Boolean(showPasswordError)}
          describedBy={showPasswordError ? 'admin-password-error' : undefined}
          className="login-field h-10 bg-card dark:bg-card"
          onChange={updatePassword}
          onBlur={() => {
            setTouched((current) => ({ ...current, password: true }))
            setErrors((current) => ({ ...current, password: validateAdminPassword(password) }))
          }}
        />
        {showPasswordError ? (
          <p id="admin-password-error" className="text-xs text-destructive" role="alert">
            {errors.password}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember-me"
            checked={remember}
            disabled={pending}
            onCheckedChange={(value) => setRemember(value === true)}
          />
          <Label htmlFor="remember-me" className="font-normal">
            Remember me
          </Label>
        </div>
        <Link
          to="/admin/forgot-password"
          className="rounded-sm text-sm font-medium text-primary outline-none underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-disabled={pending || undefined}
          onClick={(event) => {
            if (pending) event.preventDefault()
          }}
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" className="h-10 w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
