import { useState } from 'react'
import { Field } from '@/components/shared/Field'
import { ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePanelist } from '@/hooks/usePanelists'
import { getErrorMessage } from '@/lib/errors'
import { required, sanitizePhoneInput, validateOptionalPhone } from '@/lib/validators'
import type { OnboardingAnswer, Panelist, UpdatePanelistInput } from '@/types'

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
  const detail = usePanelist(open && panelist ? panelist.id : '')
  const saved = detail.data

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      {open && panelist ? (
        detail.isLoading ? (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit panelist</DialogTitle>
              <DialogDescription>Loading saved panelist details.</DialogDescription>
            </DialogHeader>
            <LoadingSkeleton rows={6} />
          </DialogContent>
        ) : detail.isError || !saved ? (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit panelist</DialogTitle>
            </DialogHeader>
            <ErrorState message={getErrorMessage(detail.error)} onRetry={() => detail.refetch()} />
          </DialogContent>
        ) : (
          <PanelistEditForm
            key={saved.id}
            panelist={saved}
            pending={pending}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        )
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
  panelist: Panelist & { onboardingAnswers: OnboardingAnswer[] }
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
  const [errors, setErrors] = useState<Record<string, string>>({})

  function submit() {
    const phoneUnchanged = form.phone.trim() === panelist.phone.trim()
    const next = {
      firstName: required(form.firstName, 'First name') ?? '',
      phone: phoneUnchanged ? '' : (validateOptionalPhone(form.phone) ?? ''),
    }
    setErrors(next)
    if (Object.values(next).some(Boolean) || pending) return
    onSubmit({
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
    })
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit panelist</DialogTitle>
        <DialogDescription>
          Update name, phone, account status, and email verification. Gender and onboarding answers come from the
          panelist detail and cannot be changed here.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName}>
          <Input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
        </Field>
        <Field label="Last name">
          <Input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
        </Field>
        <Field label="Email" className="sm:col-span-2">
          <Input value={panelist.email} disabled />
        </Field>
        <Field label="Phone (optional)" error={errors.phone}>
          <Input
            inputMode="numeric"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: sanitizePhoneInput(event.target.value) })}
          />
        </Field>
        <Field label="Status" htmlFor="edit-panelist-status" className="sm:col-span-2">
          <Select
            value={form.status}
            onValueChange={(value) => setForm({ ...form, status: value as UpdatePanelistInput['status'] })}
          >
            <SelectTrigger id="edit-panelist-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="Verification"
          htmlFor="edit-panelist-verification"
          className="sm:col-span-2"
          hint="Only active, verified panelists can be assigned to projects."
        >
          <Select
            value={form.isVerified ? 'verified' : 'unverified'}
            onValueChange={(value) => setForm({ ...form, isVerified: value === 'verified' })}
          >
            <SelectTrigger id="edit-panelist-verification" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {panelist.onboardingAnswers.map((item) => (
          <SavedAnswerField key={item.id || item.question} answer={item} />
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function SavedAnswerField({ answer }: { answer: OnboardingAnswer }) {
  const selected = answer.selectedIds.filter((id) => answer.options.some((option) => option.id === id))
  const multiple = answer.fieldType === 'checkbox' || selected.length > 1

  return (
    <Field label={answer.question || 'Onboarding answer'} className="sm:col-span-2">
      {multiple && answer.options.length > 0 ? (
        <div className="grid gap-2">
          {answer.options.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm">
              <Checkbox checked={selected.includes(option.id)} disabled />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      ) : selected.length === 1 ? (
        <Select value={selected[0]} disabled>
          <SelectTrigger className="w-full" disabled>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {answer.options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input value={answer.answer} disabled readOnly />
      )}
    </Field>
  )
}
