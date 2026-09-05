import type { ReactNode } from 'react'

import { LogoutButton } from '@/features/auth/components/logout-button'
import { ProtectedShell } from '@/features/auth/components/protected-shell'

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <ProtectedShell actions={<LogoutButton />}>{children}</ProtectedShell>
}
