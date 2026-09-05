'use client'

import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function ProductDeleteDialog({
  correlationId,
  errorMessage,
  isConfirming = false,
  onConfirm,
  onOpenChange,
  productName,
}: Readonly<{
  correlationId?: string
  errorMessage?: string
  isConfirming?: boolean
  onConfirm: () => void | Promise<void>
  onOpenChange?: (open: boolean) => void
  productName: string
}>) {
  const [open, setOpen] = useState(false)

  function handleOpenChange(nextOpen: boolean) {
    if (isConfirming) {
      return
    }

    setOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogTrigger
        disabled={isConfirming}
        render={<Button variant="destructive" />}
      >
        Excluir produto
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
          <AlertDialogDescription>
            O produto “{productName}” será removido do catálogo. Essa ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível excluir</AlertTitle>
            <AlertDescription>
              <p>{errorMessage}</p>
              {correlationId && (
                <p className="mt-2 text-xs">Referência: {correlationId}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isConfirming}
            onClick={() => void onConfirm()}
            variant="destructive"
          >
            {isConfirming ? 'Excluindo…' : 'Confirmar exclusão'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
