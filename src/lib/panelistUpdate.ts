import { joinName } from '@/lib/mappers'
import type { UpdatePanelistInput } from '@/types'

/** Fields the admin panelist update contract accepts. Email, country, industry, and panel membership are omitted. */
export function toPanelistUpdateBody(input: UpdatePanelistInput) {
  return {
    name: joinName(input.firstName, input.lastName),
    phone: input.phone,
    status: input.status,
    is_verified: input.isVerified ? 1 : 0,
  }
}
