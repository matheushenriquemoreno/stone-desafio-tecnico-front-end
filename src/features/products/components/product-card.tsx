import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatProductPrice } from '@/features/products/format-product-price'
import type { Product } from '@/features/products/types'

import { ProductImage } from './product-image'

type ProductCardProps = Readonly<{
  product: Product
}>

export function ProductCard({ product }: ProductCardProps) {
  return (
    <li>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-col gap-4">
          <ProductImage alt={`Imagem de ${product.name}`} src={product.imageUrl} />
          <div className="flex flex-col gap-1">
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>{product.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-display text-2xl font-semibold tracking-tight">
            {formatProductPrice(product.price)}
          </p>
        </CardContent>
      </Card>
    </li>
  )
}
