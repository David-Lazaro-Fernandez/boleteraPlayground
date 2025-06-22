'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import { CartSummary } from '@/lib/stripe/types'
import { formatPrice } from '@/lib/stripe/checkout'

interface CartSummaryProps {
  cartSummary: CartSummary
  onRemoveItem: (itemId: string) => void
  onUpdateQuantity: (itemId: string, newQuantity: number) => void
  showTitle?: boolean
  className?: string
}

export function CartSummaryComponent({
  cartSummary,
  onRemoveItem,
  onUpdateQuantity,
  showTitle = true,
  className = ''
}: CartSummaryProps) {
  if (cartSummary.items.length === 0) {
    return (
      <Card className={`bg-gray-50 ${className}`}>
        <CardContent className="p-6 text-center">
          <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Tu carrito está vacío</p>
          <p className="text-sm text-gray-500 mt-2">
            Selecciona boletos para agregar al carrito
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Carrito ({cartSummary.totalItems} boletos)
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Items del carrito */}
        <div className="space-y-3">
          {cartSummary.items.map((item) => (
            <div key={item.id} className="flex justify-between items-start p-3 rounded-lg border bg-gray-50">
              <div className="flex-1">
                <div className="font-medium text-gray-800">{item.zoneName}</div>
                {item.type === 'seat' ? (
                  <div className="text-sm text-gray-600">
                    Fila {item.rowLetter}, Asiento {item.seatNumber}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    Boleto General
                  </div>
                )}
                <div className="text-sm font-semibold text-green-600">
                  {formatPrice(item.price)}
                  {item.type === 'general' && item.quantity && item.quantity > 1 && (
                    <span> x {item.quantity}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Controles de cantidad para boletos generales */}
                {item.type === 'general' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) - 1)}
                      disabled={(item.quantity || 1) <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity || 1}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onUpdateQuantity(item.id, (item.quantity || 1) + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                {/* Botón eliminar */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Resumen de precios */}
        <div className="space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(cartSummary.subtotal)}</span>
          </div>
          
          <div className="flex justify-between text-gray-600">
            <span>Cargo por servicio (18%)</span>
            <span>{formatPrice(cartSummary.serviceCharge)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>{formatPrice(cartSummary.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 