'use client'

import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'
import { getConfiguredImageOrigins, isAllowedImageUrl } from '@/lib/image-origin-policy'

type ProductImageProps = Readonly<{
  alt: string
  className?: string
  src: string
}>

function ProductImageFallback({ alt, className }: Omit<ProductImageProps, 'src'>) {
  return (
    <div
      aria-label={`Imagem indisponível: ${alt}`}
      className={cn(
        'flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-lg bg-muted text-muted-foreground',
        className,
      )}
      role="img"
    >
      <ImageOff aria-hidden="true" className="size-6" />
      <span className="text-xs font-medium">Imagem indisponível</span>
    </div>
  )
}

export function ProductImage({ alt, className, src }: ProductImageProps) {
  const [failedSource, setFailedSource] = useState<string | undefined>()
  const isRenderable =
    failedSource !== src && isAllowedImageUrl(src, getConfiguredImageOrigins())

  if (!isRenderable) {
    return <ProductImageFallback alt={alt} className={className} />
  }

  return (
    <div
      className={cn(
        'relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-muted',
        className,
      )}
    >
      <Image
        alt={alt}
        className="object-cover"
        fill
        onError={() => setFailedSource(src)}
        sizes="(min-width: 768px) 50vw, 100vw"
        src={src}
      />
    </div>
  )
}
