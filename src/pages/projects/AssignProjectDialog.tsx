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
import { PointsInput } from '@/components/ui/points-input'
import { Textarea } from '@/components/ui/textarea'
import {
  SURVEY_NAME_MAX_LENGTH,
  validatePoints,
  validateSurveyName,
  validateSurveyUrl,
} from '@/lib/validators'
import type { ProjectAssignment, UpdateSurveyInput } from '@/types'

function toForm(assignment: ProjectAssignment) {
  return {
    surveyName: assignment.projectName,
    surveyUrl: assignment.surveyUrl,
    rewardPoints: String(assignment.rewardPoints),
    remark: assignment.remark ?? '',
  }
}

export function AssignProjectDialog({
  open,
  assignment,
  pending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  assignment?: ProjectAssignment | null
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: UpdateSurveyInput) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      {open && assignment ? (
        <EditSurveyForm
          key={assignment.id}
          assignment={assignment}
          pending={pending}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  )
}

function EditSurveyForm({
  assignment,
  pending,
  onOpenChange,
  onSubmit,
}: {
  assignment: ProjectAssignment
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: UpdateSurveyInput) => void
}) {
  const [form, setForm] = useState(() => toForm(assignment))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const credited = assignment.status === 'complete'

  function submit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    const next = {
      surveyName: validateSurveyName(form.surveyName) ?? '',
      surveyUrl: validateSurveyUrl(form.surveyUrl) ?? '',
      rewardPoints: credited ? '' : (validatePoints(form.rewardPoints, 'Reward points') ?? ''),
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return
    onSubmit({
      surveyName: form.surveyName.trim(),
      surveyUrl: form.surveyUrl.trim(),
      ...(credited ? {} : { rewardPoints: Number(form.rewardPoints) }),
      remark: form.remark.trim(),
    })
  }

  return (
    <DialogContent className="sm:max-w-xl">
      <form onSubmit={submit} noValidate className="grid gap-5">
        <DialogHeader>
          <DialogTitle className="font-display">Edit assignment</DialogTitle>
          <DialogDescription>
            {assignment.panelistName} · Assignment #{assignment.id}. Use “Mark complete” from the table to credit
            points.
          </DialogDescription>
        </DialogHeader>
        <fieldset disabled={pending} className="grid gap-4">
          <Field label="Survey name" htmlFor="edit-survey-name" error={errors.surveyName}>
            <Input
              id="edit-survey-name"
              value={form.surveyName}
              maxLength={SURVEY_NAME_MAX_LENGTH}
              aria-invalid={Boolean(errors.surveyName)}
              onChange={(event) =>
                setForm({ ...form, surveyName: event.target.value.slice(0, SURVEY_NAME_MAX_LENGTH) })
              }
            />
          </Field>
          <Field
            label="Survey URL"
            htmlFor="edit-survey-url"
            error={errors.surveyUrl}
            hint="Include {panelist_id} where the survey vendor expects the panelist ID."
          >
            <Input
              id="edit-survey-url"
              type="url"
              value={form.surveyUrl}
              aria-invalid={Boolean(errors.surveyUrl)}
              onChange={(event) => setForm({ ...form, surveyUrl: event.target.value })}
            />
          </Field>
          <Field
            label="Reward points"
            htmlFor="edit-survey-points"
            error={errors.rewardPoints}
            hint={credited ? 'Locked — these points were already credited when the survey was completed.' : undefined}
          >
            <PointsInput
              id="edit-survey-points"
              value={form.rewardPoints}
              disabled={credited}
              aria-invalid={Boolean(errors.rewardPoints)}
              onValueChange={(value) => setForm({ ...form, rewardPoints: value })}
            />
          </Field>
          <Field label="Remark (optional)" htmlFor="edit-survey-remark">
            <Textarea
              id="edit-survey-remark"
              value={form.remark}
              rows={3}
              onChange={(event) => setForm({ ...form, remark: event.target.value })}
            />
          </Field>
        </fieldset>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
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
