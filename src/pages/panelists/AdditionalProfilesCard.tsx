import { useState } from 'react'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/shared/PageState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAdditionalProfiles, useProfileQuestions } from '@/hooks/usePanelists'
import { renderProfileFields, type AdditionalProfile } from '@/lib/additionalProfiles'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'

export function AdditionalProfilesCard({ panelistId }: { panelistId: string }) {
  const profiles = useAdditionalProfiles(panelistId)
  const [selected, setSelected] = useState<{ panelistId: string; id: string; profileType: string } | null>(null)
  const selection = selected?.panelistId === panelistId ? selected : null
  const openProfile =
    profiles.data?.find(
      (profile) =>
        profile.panelistId === panelistId &&
        profile.id === selection?.id &&
        profile.profileType === selection.profileType,
    ) ?? null

  return (
    <Card className="mt-4 shadow-sm">
      <CardHeader>
        <CardTitle className="font-display text-xl">Additional profiles</CardTitle>
      </CardHeader>
      <CardContent>
        {profiles.isLoading ? (
          <LoadingSkeleton rows={2} />
        ) : profiles.isError ? (
          <ErrorState message={getErrorMessage(profiles.error)} onRetry={() => profiles.refetch()} />
        ) : !profiles.data?.length ? (
          <EmptyState title="No additional profiles." description="This panelist has not saved a B2B, healthcare, or patient profile." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {profiles.data.map((profile) => (
              <div
                key={`${profile.profileType}-${profile.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{profile.title}</p>
                  <p className="text-xs text-muted-foreground">{profile.reference}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSelected({ panelistId, id: profile.id, profileType: profile.profileType })}
                >
                  View
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AdditionalProfileDialog
        panelistId={panelistId}
        profile={openProfile}
        open={Boolean(selection)}
        missing={Boolean(selection) && !profiles.isLoading && !openProfile}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
        onRetry={() => profiles.refetch()}
      />
    </Card>
  )
}

function AdditionalProfileDialog({
  panelistId,
  profile,
  open,
  missing,
  onOpenChange,
  onRetry,
}: {
  panelistId: string
  profile: AdditionalProfile | null
  open: boolean
  missing: boolean
  onOpenChange: (open: boolean) => void
  onRetry: () => void
}) {
  const questions = useProfileQuestions(open && profile?.panelistId === panelistId ? profile.profileType : '')
  const fields = profile ? renderProfileFields(profile, questions.data ?? []) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{profile?.title ?? 'Additional profile'}</DialogTitle>
          <DialogDescription>{profile ? `${profile.reference} for panelist ${panelistId}` : 'Profile details'}</DialogDescription>
        </DialogHeader>

        {missing ? (
          <ErrorState message="This profile is not available for this panelist." onRetry={onRetry} />
        ) : profile && questions.isLoading && fields.length === 0 ? (
          <LoadingSkeleton rows={4} />
        ) : profile && questions.isError && fields.length === 0 ? (
          <ErrorState message={getErrorMessage(questions.error)} onRetry={() => questions.refetch()} />
        ) : profile ? (
          <div className="grid gap-4">
            {questions.isError ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
                <p className="text-muted-foreground">{getErrorMessage(questions.error)} Saved answers are shown below.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => questions.refetch()}>
                  Try again
                </Button>
              </div>
            ) : null}
            {questions.isLoading ? <p className="text-xs text-muted-foreground">Loading the full questionnaire…</p> : null}
            {profile.metadata.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.metadata.map((item) => (
                  <Info key={item.label} label={item.label} value={isDateField(item.label) ? formatDate(item.value) : item.value} />
                ))}
              </div>
            ) : null}
            {fields.length === 0 ? (
              <EmptyState title="No answers returned." description="This profile has no questions or saved answers." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <Info key={field.id} label={field.label} help={field.helpText} value={field.value} wide={field.wide} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <LoadingSkeleton rows={4} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Info({
  label,
  value,
  help,
  wide = false,
}: {
  label: string
  value: string
  help?: string
  wide?: boolean
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      {help ? <p className="mt-1 text-xs text-muted-foreground">{help}</p> : null}
      <p className="mt-1 text-sm font-medium break-words whitespace-pre-wrap">{value || '—'}</p>
    </div>
  )
}

function isDateField(label: string) {
  return label === 'Created' || label === 'Updated'
}
