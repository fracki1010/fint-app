# Guía de Usuario: Comprobantes (Vouchers)

## Introducción

El sistema de comprobantes permite generar, gestionar y descargar tres tipos de documentos fiscales:

- **Factura (Invoice)** - Documento fiscal completo con datos del cliente y negocio
- **Remito (Delivery Note)** - Comprobante de entrega con cantidades (sin precios)
- **Recibo (Receipt)** - Comprobante de pago para órdenes pagadas

## Tabla de Contenidos

1. [Configuración](#configuración)
2. [Generación de Comprobantes](#generación-de-comprobantes)
3. [Descarga de PDFs](#descarga-de-pdfs)
4. [Anulación de Comprobantes](#anulación-de-comprobantes)
5. [Reimpresión](#reimpresión)
6. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Configuración

### Acceder a Configuración de Comprobantes

1. Ve a **Configuración** en el menú principal
2. Selecciona **Comprobantes**

### Prefijos Personalizados

Puedes personalizar los prefijos de cada tipo de comprobante:

- **Factura**: Por defecto `F-` (ej: F-000042)
- **Remito**: Por defecto `R-` (ej: R-000015)
- **Recibo**: Por defecto `D-` (ej: D-000008)

**Ejemplos de prefijos personalizados:**
- `FAC-` → FAC-000042
- `REM-` → REM-000015
- `REC-` → REC-000008

### Numeración Inicial

Define desde qué número comenzar la numeración para cada tipo:
- Si tu última factura fue 1543, configura "Próximo número" en 1544
- El sistema automáticamente formateará con ceros a la izquierda

### Generación Automática

Configura qué comprobantes se generan automáticamente al crear una venta:

- **Auto-generar Factura**: Recomendado para ventas con facturación habitual
- **Auto-generar Remito**: Útil si siempre entregas productos
- **Auto-generar Recibo**: Solo disponible para órdenes pagadas

### Reinicio Anual

Al activar esta opción, los contadores se reinician a 1 cada año nuevo:
- Útil para cumplir con requisitos fiscales anuales
- Los comprobantes del año anterior se mantienen en el sistema
- El año se incluye en el formato: F-2026-000001

---

## Generación de Comprobantes

### Durante una Venta (QuickSale / Nueva Operación)

1. Completa los datos de la venta normalmente
2. En el paso de confirmación, verás la sección **"Generar comprobantes"**
3. Selecciona los tipos de comprobantes que necesitas:
   - ✅ Factura
   - ✅ Remito
   - ✅ Recibo (solo disponible si la orden está pagada)
4. Confirma la venta
5. Los comprobantes se generan automáticamente

### Para Ventas Existentes

1. Busca la orden en el historial
2. Abre el detalle de la orden
3. En la sección **Comprobantes**, haz clic en **"Generar más"**
4. Selecciona los tipos de comprobantes a generar

### Generación Múltiple

Puedes generar los 3 tipos de comprobantes simultáneamente:
1. Una Factura (F-XXXXXX)
2. Un Remito (R-XXXXXX)  
3. Un Recibo (D-XXXXXX)

Cada uno tiene su propia numeración independiente.

---

## Descarga de PDFs

### Desde el Detalle de Orden

1. Abre la orden que contiene los comprobantes
2. En la sección **Comprobantes**, verás la lista de documentos
3. Haz clic en el botón de descarga (📥) junto al comprobante deseado
4. El PDF se descargará automáticamente

### Descarga Múltiple

Si una orden tiene varios comprobantes:
1. Haz clic en el botón **"Comprobantes"** (muestra el contador)
2. Selecciona **"Descargar todos"** para obtener un ZIP con todos los PDFs

### Formato de Archivos

Los archivos se descargan con el formato: `{NÚMERO}.pdf`
- `F-000042.pdf`
- `R-000015.pdf`
- `D-000008.pdf`

---

## Anulación de Comprobantes

### Cuándo Anular

Debes anular un comprobante cuando:
- Hay errores en los datos del cliente
- La venta fue cancelada
- Se necesita corregir información fiscal
- El comprobante se generó por error

**Importante**: Los comprobantes anulados se mantienen en el sistema con fines de auditoría. El número anulado **no se reutiliza**.

### Proceso de Anulación

1. Abre el detalle de la orden
2. En la sección **Comprobantes**, encuentra el comprobante a anular
3. Haz clic en el botón de anulación (🚫)
4. Ingresa el **motivo de anulación** (mínimo 3 caracteres)
5. Confirma la anulación

El comprobante cambiará su estado a **"Anulado"** y mostrará:
- Fecha de anulación
- Motivo ingresado
- Usuario que realizó la anulación

### Después de Anular

Si necesitas un comprobante correcto:
1. Genera un nuevo comprobante del mismo tipo
2. Recibirá el siguiente número en secuencia
3. Ejemplo: Si anulas F-000042, el nuevo será F-000043

---

## Reimpresión

### Volver a Descargar

Los comprobantes activos pueden descargarse las veces que necesites:
1. Ve al detalle de la orden
2. Encuentra el comprobante en la lista
3. Haz clic en descargar

### Si el PDF está Dañado

En caso de archivos corruptos:
1. Anula el comprobante con el motivo "PDF dañado"
2. Genera un nuevo comprobante
3. El nuevo tendrá número correlativo siguiente

---

## Preguntas Frecuentes

### ¿Puedo modificar un comprobante ya generado?

No. Por razones de auditoría fiscal, los comprobantes no son editables. Debes:
1. Anular el comprobante incorrecto
2. Generar uno nuevo con los datos correctos

### ¿Qué pasa si se acaban los números?

El sistema soporta numeración hasta 999,999. Si te acercas al límite:
1. Cambia el prefijo (ej: de F- a F2-)
2. Reinicia el contador a 1
3. Los comprobantes seguirán siendo únicos

### ¿Los comprobantes tienen validez fiscal?

Los comprobantes generados son documentos válidos para:
- Control interno del negocio
- Entrega al cliente
- Registro contable

**Nota**: Verifica los requisitos específicos de tu jurisdicción fiscal.

### ¿Puedo generar recibo sin factura?

Sí. El sistema permite generar comprobantes de forma independiente:
- Solo recibo para pagos recibidos
- Solo remito para entregas
- Solo factura cuando sea necesario

### ¿Qué significa "Solo disponible para órdenes pagadas"?

El recibo es un comprobante de pago, por lo tanto:
- Se deshabilita si el estado de pago es "Pendiente"
- Se habilita cuando el estado de pago es "Pagado"
- Esto garantiza coherencia contable

### ¿Cómo funciona el reinicio anual?

Si está activado:
- El 1 de enero de cada año, los contadores vuelven a 1
- El año se incluye en el número: F-2026-000001
- Los comprobantes del año anterior mantienen su numeración

### ¿Dónde se almacenan los PDFs?

Los archivos se guardan en el servidor en la ruta:
```
/comprobantes/{tenantId}/{año}/{tipo}/{archivo}.pdf
```

Se mantienen por 2 años, luego se archivan automáticamente.

### ¿Puedo ver comprobantes de años anteriores?

Sí. Todos los comprobantes permanecen en la base de datos:
- Usa los filtros de fecha en el historial
- Los PDFs archivados pueden restaurarse
- Los metadatos siempre están disponibles

---

## Soporte

Si tienes problemas con los comprobantes:

1. Verifica que los datos fiscales del negocio estén completos en Configuración > Empresa
2. Revisa que el cliente tenga nombre o teléfono asignado
3. Confirma que la orden tenga productos y total mayor a 0
4. Contacta soporte si el error persiste

---

## Atajos de Teclado

| Acción | Atajo |
|--------|-------|
| Generar comprobantes | Alt + G |
| Descargar PDF | Alt + D |
| Anular comprobante | Alt + A |
| Cerrar modal | Escape |

---

**Versión**: 1.0  
**Última actualización**: Enero 2026
