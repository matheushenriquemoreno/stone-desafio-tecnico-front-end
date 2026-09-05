'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { logout } from '@/features/auth/api/auth-gateway'
import type { LogoutResult } from '@/features/auth/types'
import { redirectToLogin } from '@/lib/redirect-to-login'

const genericLogoutError =
  'Não foi possível encerrar a sessão. Tente novamente em instantes.'

function getLogoutFeedback(result: LogoutResult): {
  correlationId?: string
  message: string
} {
  if (result.kind !== 'error') {
    return { message: genericLogoutError }
  }

  if (result.error.code === 'forbidden') {
    return {
      correlationId: result.error.correlationId,
      message: 'Esta origem não está autorizada a encerrar a sessão.',
    }
  }

  if (result.error.code === 'rate-limit') {
    const waitMessage =
      result.error.retryAfterSeconds === undefined
        ? ' Aguarde alguns instantes antes de tentar novamente.'
        : ` Aguarde ${result.error.retryAfterSeconds} segundos antes de tentar novamente.`

    return {
      correlationId: result.error.correlationId,
      message: `Muitas tentativas de logout.${waitMessage}`,
    }
  }

  return {
    correlationId: result.error.correlationId,
    message: genericLogoutError,
  }
}

export function LogoutButton() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    correlationId?: string
    message: string
  }>()

  async function handleLogout() {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setFeedback(undefined)

    try {
      const result = await logout()

      if (result.kind === 'success') {
        redirectToLogin(router)
        return
      }

      setFeedback(getLogoutFeedback(result))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {feedback && (
        <Alert className="basis-full sm:basis-auto" variant="destructive">
          <AlertTitle>Não foi possível sair</AlertTitle>
          <AlertDescription>
            <p>{feedback.message}</p>
            {feedback.correlationId && (
              <p className="mt-2">Referência de suporte: {feedback.correlationId}</p>
            )}
          </AlertDescription>
        </Alert>
      )}
      <Button
        aria-busy={isSubmitting}
        disabled={isSubmitting}
        onClick={() => void handleLogout()}
        size="sm"
        variant="secondary"
      >
        {isSubmitting ? (
          <Spinner aria-hidden="true" data-icon="inline-start" />
        ) : (
          <LogOut aria-hidden="true" data-icon="inline-start" />
        )}
        {isSubmitting ? 'Saindo…' : 'Sair'}
      </Button>
    </div>
  )
}
