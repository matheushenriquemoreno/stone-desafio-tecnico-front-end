import type { Metadata } from 'next'

import { RegisterScreen } from '@/features/auth/components/register-screen'

export const metadata: Metadata = {
  title: 'Cadastro',
  description: 'Crie sua conta para acessar o catálogo de produtos.',
}

export default function RegisterPage() {
  return <RegisterScreen />
}
