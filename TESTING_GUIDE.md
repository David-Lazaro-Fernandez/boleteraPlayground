# Guía de Pruebas - Flujo de Pagos y Actualización de Asientos

## Resumen de los Cambios Realizados

### 1. **Reglas de Firestore Actualizadas**
- ✅ Reglas modificadas para permitir operaciones de webhooks
- ✅ Validaciones estrictas para operaciones no autenticadas
- ✅ Mantenimiento de seguridad para operaciones de usuarios

### 2. **Función Reutilizable de Asientos**
- ✅ Creada función `updateSeatsFromCartItems` en `lib/firebase/seat-management.ts`
- ✅ Soporte para validación de disponibilidad
- ✅ Funciones para liberar asientos

### 3. **Webhooks y APIs Actualizados**
- ✅ Webhook de Stripe integrado con actualización de asientos
- ✅ API de verify-payment actualizada
- ✅ Componente de venta local actualizado

## Instrucciones de Prueba

### **PASO 1: Actualizar Reglas de Firestore**

1. Accede a la consola de Firebase
2. Ve a **Firestore Database** → **Rules**
3. Reemplaza las reglas actuales con el contenido de `firestore-rules-updated.rules`
4. Publica los cambios

### **PASO 2: Probar Venta Local**

1. Accede al dashboard de la aplicación
2. Ve a la sección de **Venta**
3. Selecciona algunos asientos específicos
4. Agrega algunos tickets generales
5. Completa la venta
6. **Verificar**:
   - ✅ Los asientos se marcan como ocupados en el mapa
   - ✅ Se crea el movimiento en Firestore
   - ✅ Se crean los tickets correspondientes
   - ✅ Se actualiza el archivo JSON en Firebase Storage

### **PASO 3: Probar Compra Online**

1. Accede a la página pública de eventos
2. Selecciona un evento
3. Elige asientos específicos
4. Completa el checkout con Stripe (usar datos de prueba)
5. **Verificar**:
   - ✅ Los asientos se marcan como vendidos en el mapa
   - ✅ Se crea el movimiento en Firestore con `status: 'paid'`
   - ✅ Se crean los tickets correspondientes
   - ✅ Se actualiza el archivo JSON en Firebase Storage
   - ✅ Se procesa el webhook correctamente

### **PASO 4: Verificar Logs**

Revisa los logs en la consola del navegador y en los logs de Vercel/servidor:

#### **Logs Esperados - Venta Local**
```
Asientos actualizados exitosamente
Successfully updated X seats from cart items
```

#### **Logs Esperados - Compra Online (Webhook)**
```
Seats updated successfully for webhook transaction
Successfully updated X seats in Seats_data_last_actualizado.json
```

#### **Logs Esperados - Verify Payment**
```
Seats updated successfully for verify-payment transaction
```

### **PASO 5: Verificar Base de Datos**

1. **Firestore Collections**:
   - `movements`: Debe tener el nuevo movimiento con `status: 'paid'`
   - `tickets`: Debe tener los tickets creados
   - `movement_tickets`: Debe tener las relaciones correctas

2. **Firebase Storage**:
   - Archivo `Seats_data_last_actualizado.json` debe tener los asientos actualizados
   - Los asientos deben tener `status: 'sold'` u `'occupied'`

### **PASO 6: Probar Casos Edge**

#### **Caso 1: Pago Fallido**
1. Usar una tarjeta de prueba que falle
2. Verificar que los asientos NO se actualicen
3. Verificar que NO se creen tickets

#### **Caso 2: Solo Tickets Generales**
1. Comprar solo tickets generales (sin asientos específicos)
2. Verificar que no se actualicen asientos
3. Verificar que se creen los tickets generales

#### **Caso 3: Compra Mixta**
1. Combinar asientos específicos y tickets generales
2. Verificar que solo se actualicen los asientos específicos
3. Verificar que se creen todos los tipos de tickets

## Comandos de Debugging

### **Verificar Reglas de Firestore**
```bash
# Desde la consola de Firebase
firebase firestore:rules:get
```

### **Probar Webhooks Localmente**
```bash
# Instalar Stripe CLI
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### **Verificar Storage**
```javascript
// En la consola del navegador
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from './lib/firebase/config';

const fileRef = ref(storage, 'Seats_data_last_actualizado.json');
getDownloadURL(fileRef).then(url => {
  fetch(url).then(res => res.json()).then(data => console.log(data));
});
```

## Troubleshooting

### **Problema: Asientos no se actualizan**
1. Verificar que las reglas de Firestore estén aplicadas
2. Revisar logs de errores en la consola
3. Verificar que el archivo JSON existe en Firebase Storage
4. Confirmar que los IDs de asientos coinciden

### **Problema: Webhooks fallan**
1. Verificar que el webhook secret esté configurado
2. Revisar los logs de Stripe Dashboard
3. Confirmar que las reglas de Firestore permiten operaciones sin auth
4. Verificar que los metadatos del checkout incluyan cartItems

### **Problema: Permissions denied**
1. Verificar que las reglas de Firestore se aplicaron correctamente
2. Confirmar que los timestamps se están enviando correctamente
3. Revisar que los datos cumplan con las validaciones

## Monitoreo Continuo

### **Métricas a Monitorear**
- Tasa de éxito de webhooks
- Tiempo de respuesta de actualización de asientos
- Errores de permisos en Firestore
- Consistencia entre Firestore y Firebase Storage

### **Alertas Recomendadas**
- Fallos de webhook > 5% en 10 minutos
- Errores de actualización de asientos > 3 en 5 minutos
- Inconsistencias en datos de asientos

---

## Resumen de Archivos Modificados

1. **firestore-rules-updated.rules** - Nuevas reglas de seguridad
2. **lib/firebase/seat-management.ts** - Función reutilizable para asientos
3. **app/api/stripe/webhook/route.ts** - Webhook actualizado
4. **app/api/stripe/verify-payment/route.ts** - API actualizada
5. **components/palenque/venta.tsx** - Componente de venta actualizado

## Estado Final

✅ **Problema 1 Resuelto**: Los asientos se actualizan correctamente después de pagos online
✅ **Problema 2 Resuelto**: Las compras procesadas se guardan en Firebase con permisos correctos
✅ **Seguridad Mantenida**: Solo operaciones válidas pueden escribir sin autenticación
✅ **Compatibilidad**: Funciona tanto para ventas locales como online 