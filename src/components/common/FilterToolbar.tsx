import { Filter } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function FilterToolbar({
  search,
  renderFilters,
  mobileOpen,
  onMobileOpenChange,
  onClear,
  children,
}: {
  search: ReactNode
  renderFilters?: () => ReactNode
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
  onClear: () => void
  children?: ReactNode
}) {
  return (
    <>
      <div className="flex flex-col gap-3 border-b px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">{search}</div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {renderFilters ? (
              <Button variant="outline" className="lg:hidden" onClick={() => onMobileOpenChange(true)}>
                <Filter className="size-4" />
                Filters
              </Button>
            ) : null}
            <Button variant="outline" onClick={onClear}>
              Clear filters
            </Button>
            {children}
          </div>
        </div>
        {renderFilters ? <div className="hidden min-w-0 lg:block">{renderFilters()}</div> : null}
      </div>
      {renderFilters ? (
        <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 p-4">
              {renderFilters()}
              <Button className="w-full" onClick={() => onMobileOpenChange(false)}>
                Apply
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  )
}
