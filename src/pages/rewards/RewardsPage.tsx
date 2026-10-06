import { Settings2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/common/DataTable'
import { FilterToolbar } from '@/components/common/FilterToolbar'
import { SearchField } from '@/components/common/SearchField'
import { PageHeader } from '@/components/shared/PageHeader'
import { ToneBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRewardMethods } from '@/hooks/useRewards'
import { useSettings } from '@/hooks/useSettings'
import { getErrorMessage } from '@/lib/errors'
import { formatNumber } from '@/lib/format'
import type { AdminSettings } from '@/types'

const PAYOUT_TOGGLES: { match: string; key: keyof AdminSettings }[] = [
  { match: 'amazon', key: 'amazonEnabled' },
  { match: 'flipkart', key: 'flipkartEnabled' },
  { match: 'paypal', key: 'paypalEnabled' },
]

function methodInitials(label: string) {
  return (
    label
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

export function RewardsPage() {
  const methods = useRewardMethods()
  const settings = useSettings()
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    const all = methods.data ?? []
    if (!term) return all
    return all.filter((method) => `${method.label} ${method.name}`.toLowerCase().includes(term))
  }, [methods.data, search])

  function toggleFor(name: string) {
    const toggle = PAYOUT_TOGGLES.find((item) => name.toLowerCase().includes(item.match))
    if (!toggle || !settings.data) return undefined
    return Boolean(settings.data[toggle.key])
  }

  const minimum = settings.data ? `${formatNumber(settings.data.minimumPayout)} pts` : '—'

  return (
    <div>
      <PageHeader
        title="Rewards"
        description="Payout methods panelists can redeem points through. Availability comes from the backend."
        crumbs={[{ label: 'Admin', to: '/admin/dashboard' }, { label: 'Rewards' }]}
        actions={
          <Button asChild>
            <Link to="/admin/settings">
              <Settings2 className="size-4" />
              Payout settings
            </Link>
          </Button>
        }
      />

      <DataTable
        toolbar={
          <FilterToolbar
            search={<SearchField value={search} onChange={setSearch} placeholder="Search rewards" />}
            mobileOpen={filterOpen}
            onMobileOpenChange={setFilterOpen}
            onClear={() => setSearch('')}
          />
        }
        loading={methods.isLoading}
        error={methods.isError ? getErrorMessage(methods.error) : undefined}
        onRetry={() => methods.refetch()}
        emptyTitle="No payout methods available."
        emptyDescription="The API did not return any payout methods. Payout toggles are managed in Settings, and panelist payouts appear under Reward Requests."
        total={rows.length}
      >
        <div className="space-y-3 p-4 md:hidden">
          {rows.map((method) => {
            const enabled = toggleFor(method.name)
            return (
              <div key={method.id} className="rounded-2xl border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{method.label}</p>
                    <p className="text-xs text-muted-foreground">{method.name}</p>
                  </div>
                  {enabled === undefined ? null : (
                    <ToneBadge tone={enabled ? 'success' : 'muted'}>{enabled ? 'Enabled' : 'Disabled'}</ToneBadge>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Minimum payout · {minimum}</p>
              </div>
            )
          })}
        </div>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reward</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Minimum points</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((method) => {
                const enabled = toggleFor(method.name)
                return (
                  <TableRow key={method.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-secondary text-xs font-semibold text-primary">
                          {methodInitials(method.label)}
                        </span>
                        <p className="font-medium">{method.label}</p>
                      </div>
                    </TableCell>
                    <TableCell>Payout</TableCell>
                    <TableCell>{minimum}</TableCell>
                    <TableCell>
                      <ToneBadge tone="success">Offered</ToneBadge>
                    </TableCell>
                    <TableCell>
                      {enabled === undefined ? (
                        '—'
                      ) : (
                        <ToneBadge tone={enabled ? 'success' : 'muted'}>{enabled ? 'Enabled' : 'Disabled'}</ToneBadge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </DataTable>
    </div>
  )
}
