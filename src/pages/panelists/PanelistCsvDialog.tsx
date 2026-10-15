import { Download, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSurveyTemplateDownload, useSurveyTemplateImport } from '@/hooks/useProjects'
import { getErrorMessage } from '@/lib/errors'

/** Maps the panelist search box onto the template API’s name, email, and phone filters. */
function templateQueryFromSearch(search: string) {
  const value = search.trim()
  if (!value) return {}
  if (value.includes('@')) return { email: value }
  if (/^[+\d][\d\s().-]*$/.test(value)) return { phone: value }
  return { name: value }
}

export function PanelistCsvDialog({
  open,
  search,
  onOpenChange,
}: {
  open: boolean
  search: string
  onOpenChange: (open: boolean) => void
}) {
  const download = useSurveyTemplateDownload()
  const csvImport = useSurveyTemplateImport()
  const fileInput = useRef<HTMLInputElement>(null)
  const [csvError, setCsvError] = useState('')
  const [csvMessage, setCsvMessage] = useState('')
  const busy = download.isPending || csvImport.isPending

  function close(next: boolean) {
    if (busy) return
    if (!next) {
      setCsvError('')
      setCsvMessage('')
    }
    onOpenChange(next)
  }

  async function downloadCsv() {
    setCsvError('')
    setCsvMessage('')
    try {
      const blob = await download.mutateAsync(templateQueryFromSearch(search))
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'survey-assignment-template.csv'
      link.click()
      URL.revokeObjectURL(url)
      setCsvMessage(
        'The template downloaded. It lists active panelists matching the current search, with blank survey columns.',
      )
    } catch (error) {
      setCsvMessage('')
      setCsvError(getErrorMessage(error))
    }
  }

  async function uploadCsv(file: File | undefined) {
    setCsvError('')
    setCsvMessage('')
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv') || file.size === 0) {
      setCsvError('Choose a non-empty CSV file from the survey assignment template.')
      return
    }
    try {
      await csvImport.mutateAsync(file)
      setCsvMessage(
        'The CSV uploaded. Blank rows are skipped. Points stay on each assignment until an admin marks it complete.',
      )
    } catch (error) {
      setCsvMessage('')
      setCsvError(getErrorMessage(error))
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CSV Import / Export</DialogTitle>
          <DialogDescription>
            Download the panelist template, or upload a completed CSV. The download uses the current search.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <section className="space-y-3 rounded-xl border p-4">
            <h2 className="text-sm font-medium">Download CSV</h2>
            <p className="text-xs text-muted-foreground">
              Download the existing panelist template for the current search.
            </p>
            <Button type="button" variant="outline" className="w-full" onClick={() => void downloadCsv()} disabled={busy}>
              <Download className="size-4" />
              {download.isPending ? 'Downloading…' : 'Download CSV'}
            </Button>
          </section>
          <section className="space-y-3 rounded-xl border p-4">
            <h2 className="text-sm font-medium">Upload CSV</h2>
            <p className="text-xs text-muted-foreground">
              Choose a completed .csv file from the template and import it.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInput.current?.click()}
              disabled={busy}
            >
              <Upload className="size-4" />
              {csvImport.isPending ? 'Uploading…' : 'Upload CSV'}
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              aria-label="Upload CSV"
              onChange={(event) => void uploadCsv(event.target.files?.[0])}
            />
          </section>
        </div>
        {csvError ? (
          <p className="text-sm text-destructive" role="alert">
            {csvError}
          </p>
        ) : null}
        {csvMessage ? (
          <p className="text-sm text-foreground" role="status">
            {csvMessage}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
