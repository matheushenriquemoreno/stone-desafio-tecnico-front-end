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
import { Button } from '@/components/ui/button'

export function ProductDeleteDialog({
  isConfirming = false,
  onConfirm,
  productName,
}: Readonly<{
  isConfirming?: boolean
  onConfirm: () => void | Promise<void>
  productName: string
}>) {
  const [open, setOpen] = useState(false)

  return (
    <AlertDialog
      onOpenChange={(nextOpen) => {
        if (!isConfirming) {
          setOpen(nextOpen)
        }
      }}
      open={open}
    >
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
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isConfirming}
            onClick={() => void onConfirm()}
            variant="destructive"
          >
            {isConfirming ? 'Excluindo…' : 'Excluir produto'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
