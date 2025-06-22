'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CartSummary, EventInfo, CustomerData } from '@/lib/stripe/types'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { Loader2, CreditCard } from 'lucide-react'

interface CheckoutButtonProps {
  cartSummary: CartSummary
  eventInfo: EventInfo
  disabled?: boolean
  className?: string
  onSuccess?: () => void
  onError?: (error: string) => void
  customerData?: CustomerData
}

export function CheckoutButton({
  cartSummary,
  eventInfo,
  disabled = false,
  className = '',
  onSuccess,
  onError,
  customerData
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCheckout = async () => {
    if (cartSummary.items.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Selecciona al menos un boleto para continuar",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      // URLs de éxito y cancelación
      const baseUrl = window.location.origin
      const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${baseUrl}/eventos/${eventInfo.id}/comprar`

      // Crear sesión de checkout
      const { url } = await createCheckoutSession(
        cartSummary,
        eventInfo,
        successUrl,
        cancelUrl,
        customerData
      )

      // Redirigir a Stripe Checkout
      if (url) {
        window.location.href = url
        onSuccess?.()
      } else {
        throw new Error('No se pudo obtener la URL de checkout')
      }

    } catch (error) {
      console.error('Error al iniciar checkout:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      
      toast({
        title: "Error al procesar pago",
        description: errorMessage,
        variant: "destructive"
      })

      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading || cartSummary.items.length === 0}
      className={`w-full ${className}`}
      size="lg"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Procesando...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 mr-2" />
          Pagar con Stripe - ${cartSummary.total.toFixed(2)} MXN
        </>
      )}
    </Button>
  )
} 