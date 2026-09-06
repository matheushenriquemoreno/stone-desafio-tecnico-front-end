import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatProductPrice } from '@/features/products/format-product-price'
import type { Product } from '@/features/products/types'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { ProductImage } from './product-image'

type ProductCardProps = Readonly<{
  product: Product
}>

export function ProductCard({ product }: ProductCardProps) {
  return (
    <li className="h-full">
      <Link
        aria-label={`Ver e editar ${product.name}`}
        className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        href={`/products/${encodeURIComponent(product.id)}`}
      >
        <Card className="h-full transition-[box-shadow,transform] duration-150 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:-translate-y-0.5 group-focus-visible:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
          <CardHeader className="flex flex-col gap-4">
            <ProductImage alt={`Imagem de ${product.name}`} src={product.imageUrl} />
            <div className="flex flex-col gap-1">
              <CardTitle className="line-clamp-2 font-display text-2xl font-semibold tracking-tight">
                <h2>{product.name}</h2>
              </CardTitle>
              <CardDescription className="line-clamp-3">
                {product.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="mt-auto">
            <p className="font-display text-2xl font-semibold tracking-tight">
              {formatProductPrice(product.price)}
            </p>
          </CardContent>
          <CardFooter className="justify-between gap-3">
            <span className="font-semibold text-link">Ver e editar</span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 shrink-0 transition-transform duration-150 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
            />
          </CardFooter>
        </Card>
      </Link>
    </li>
  )
}
