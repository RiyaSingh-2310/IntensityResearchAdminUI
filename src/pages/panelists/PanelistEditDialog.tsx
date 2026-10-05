import { useState, type FormEvent } from 'react'
import { Field } from '@/components/shared/Field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { required, sanitizePhoneInput, validateOptionalPhone } from '@/lib/validators'
import type { Panelist, UpdatePanelistInput } from '@/types'

export function PanelistEditDialog({
  open,
  panelist,
  pending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  panelist: Panelist | null
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: UpdatePanelistInput) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      {open && panelist ? (
        <PanelistEditForm
          key={panelist.id}
          panelist={panelist}
          pending={pending}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  )
}

function PanelistEditForm({
  panelist,
  pending,
  onOpenChange,
  onSubmit,
}: {
  panelist: Panelist
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: UpdatePanelistInput) => void
}) {
  const [form, setForm] = useState<UpdatePanelistInput>({
    firstName: panelist.firstName,
    lastName: panelist.lastName,
    phone: panelist.phone,
    status: panelist.status === 'active' ? 'active' : 'inactive',
    isVerified: panelist.isVerified,
  })
  const [errors, setErrors] = useState<Partial<Record<'firstName' | 'phone', string>>>({})

  function submit(event: FormEvent) {
    event.preventDefault()
    const next = {
      firstName: required(form.firstName, 'First name'),
      phone: validateOptionalPhone(form.phone),
    }
    setErrors(next)
    if (next.firstName || next.phone || pending) return
    onSubmit({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
    })
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <form onSubmit={submit} noValidate className="grid gap-5">
        <DialogHeader>
          <DialogTitle className="font-display">Edit panelist</DialogTitle>
          <DialogDescription>
            Update contact details, account status and email verification. Onboarding answers are read-only.
          </DialogDescription>
        </DialogHeader>
        <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="edit-first-name" error={errors.firstName}>
            <Input
              id="edit-first-name"
              value={form.firstName}
              aria-invalid={Boolean(errors.firstName)}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            />
          </Field>
          <Field label="Last name" htmlFor="edit-last-name">
            <Input
              id="edit-last-name"
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            />
          </Field>
          <Field label="Email" htmlFor="edit-email" hint="Email can't be changed by admins." className="sm:col-span-2">
            <Input id="edit-email" value={panelist.email} disabled readOnly />
          </Field>
          <Field label="Phone (optional)" htmlFor="edit-phone" error={errors.phone}>
            <Input
              id="edit-phone"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phone}
              aria-invalid={Boolean(errors.phone)}
              onChange={(event) => setForm({ ...form, phone: sanitizePhoneInput(event.target.value) })}
            />
          </Field>
          <Field label="Account status" htmlFor="edit-status">
            <Select
              value={form.status}
              onValueChange={(value) => setForm({ ...form, status: value as UpdatePanelistInput['status'] })}
            >
              <SelectTrigger id="edit-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <label
            htmlFor="edit-verified"
            className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border bg-surface/50 px-4 py-3 sm:col-span-2"
          >
            <span>
              <span className="block text-sm font-medium">Email verified</span>
              <span className="block text-xs text-muted-foreground">
                The survey assignment picker only lists active, verified panelists.
              </span>
            </span>
            <Switch
              id="edit-verified"
              checked={form.isVerified}
              onCheckedChange={(checked) => setForm({ ...form, isVerified: checked })}
            />
          </label>
        </fieldset>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
