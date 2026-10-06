import { Loader2 } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BRAND } from '@/config/brand'
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
  const [forgotOpen, setForgotOpen] = useState(false)
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
    <>
      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="admin-email">Email address</Label>
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
          <Label htmlFor="admin-password">Password</Label>
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
          <button
            type="button"
            className="rounded-sm text-sm text-primary outline-none underline-offset-4 hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => setForgotOpen(true)}
            disabled={pending}
          >
            Forgot password?
          </button>
        </div>

        <Button type="submit" className="h-10 w-full" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? 'Signing in...' : 'Sign in'}
        </Button>
        {formError ? (
          <p className="text-center text-xs text-destructive" role="alert">
            {formError}
          </p>
        ) : null}
      </form>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Self-service password reset is not available for administrator accounts. Contact{' '}
              <a href={`mailto:${BRAND.email}`} className="text-primary underline-offset-4 hover:underline">
                {BRAND.email}
              </a>{' '}
              to have your password reset.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
