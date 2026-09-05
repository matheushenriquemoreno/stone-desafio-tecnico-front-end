import type { ReactNode } from 'react'

import { ProtectedShell } from '@/features/auth/components/protected-shell'

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return <ProtectedShell>{children}</ProtectedShell>
}
