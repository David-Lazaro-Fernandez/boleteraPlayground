"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, ArrowLeft, Key, CheckCircle } from 'lucide-react'
import { resetPassword } from '@/lib/firebase/auth'

export default function PasswordRecoveryPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validaciones básicas
      if (!email) {
        throw new Error('Por favor ingresa tu correo electrónico')
      }

      if (!email.includes('@')) {
        throw new Error('Por favor ingresa un email válido')
      }

      // Enviar email de recuperación con Firebase Auth
      const result = await resetPassword(email)
      
      if (result.error) {
        setError(result.error)
        return
      }

      // Marcar como exitoso
      setIsSuccess(true)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el email de recuperación')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('')
  }

  if (isSuccess) {
    return (
      <Card className="w-full shadow-xl border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-700">
            Email Enviado
          </CardTitle>
          <CardDescription className="text-gray-600">
            Revisa tu bandeja de entrada
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-gray-700">
              Hemos enviado las instrucciones para restablecer tu contraseña a:
            </p>
            <p className="font-medium text-blue-600">{email}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 space-y-1">
            <p className="font-medium">¿No ves el email?</p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>Revisa tu carpeta de spam o correo no deseado</li>
              <li>Verifica que el email esté escrito correctamente</li>
              <li>Puede tomar unos minutos en llegar</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button
            onClick={() => {
              setIsSuccess(false)
              setEmail('')
            }}
            variant="outline"
            className="w-full"
          >
            Enviar a otro email
          </Button>
          
          <Link 
            href="/auth/signin" 
            className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al inicio de sesión
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-xl border-0">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
            <Key className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Recuperar Contraseña</CardTitle>
        <CardDescription className="text-gray-600">
          Ingresa tu email para recibir instrucciones de recuperación
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={handleChange}
                disabled={isLoading}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Enviaremos las instrucciones a este correo electrónico
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              'Enviar Instrucciones'
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4 text-center">
        <Link 
          href="/auth/signin" 
          className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver al inicio de sesión
        </Link>
        
        <div className="text-xs text-gray-500">
          Sistema de Boletería - Recuperación de Acceso
        </div>
      </CardFooter>
    </Card>
  )
}
