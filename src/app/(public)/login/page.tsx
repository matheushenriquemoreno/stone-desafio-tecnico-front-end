import type { Metadata } from 'next'

import { LoginScreen } from '@/features/auth/components/login-screen'

export const metadata: Metadata = {
  title: 'Login',
  description: 'Acesse sua área segura de produtos.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string | string[] | undefined }>
}) {
  const { registered } = await searchParams

  return <LoginScreen registrationConfirmed={registered === 'success'} />
}
