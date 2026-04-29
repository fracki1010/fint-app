# Plan de implementación: Insumos, Compras y Cuentas Corrientes

## 1) Objetivo
Agregar tres módulos integrados al sistema actual:
- Insumos (catálogo + stock + movimientos)
- Compras (órdenes a proveedores + recepción)
- Cuentas corrientes de proveedores (deuda, pagos, saldo)

El foco es mantener trazabilidad, evitar inconsistencias de stock y tener estado financiero claro por proveedor.

## 2) Alcance funcional

### 2.1 Insumos
- Alta, baja lógica y edición de insumos.
- Campos mínimos: nombre, SKU interno, unidad, stock actual, stock mínimo, activo.
- Registro de movimientos de stock: ingreso, egreso, ajuste.
- Alertas por stock bajo mínimo.

### 2.2 Compras
- Crear compra en borrador.
- Agregar ítems de insumo con cantidad y costo unitario.
- Confirmar recepción (total o parcial opcional en fase 2).
- Al recibir compra: impactar stock con movimientos `IN`.

### 2.3 Cuentas corrientes proveedores
- Libro de movimientos por proveedor.
- Tipos de asiento: `CHARGE`, `PAYMENT`, `CREDIT_NOTE`, `DEBIT_NOTE`.
- Relación con compras a crédito.
- Cálculo de saldo por proveedor y estado de cuenta.

## 3) Modelo de datos sugerido

### 3.1 Proveedores
Si ya existe `supplier` reutilizar. Si no:
- `suppliers`
  - `id`
  - `name`
  - `phone`
  - `email`
  - `tax_id`
  - `active`
  - `created_at`, `updated_at`

### 3.2 Insumos
- `supply_items`
  - `id`
  - `name`
  - `sku`
  - `unit` (ej: `kg`, `lt`, `u`)
  - `current_stock` (decimal)
  - `min_stock` (decimal)
  - `reference_cost` (decimal, opcional)
  - `active`
  - `created_at`, `updated_at`

- `supply_stock_movements`
  - `id`
  - `supply_item_id` (FK)
  - `type` (`IN`, `OUT`, `ADJUST`)
  - `quantity` (decimal)
  - `reason` (texto corto)
  - `source_type` (`PURCHASE`, `MANUAL`, `SALE_CONSUMPTION`, etc.)
  - `source_id` (id referencia)
  - `created_by`
  - `created_at`

### 3.3 Compras
- `purchases`
  - `id`
  - `supplier_id` (FK)
  - `date`
  - `status` (`DRAFT`, `CONFIRMED`, `RECEIVED`, `CANCELLED`)
  - `payment_condition` (`CASH`, `CREDIT`)
  - `subtotal`, `tax`, `total`
  - `notes`
  - `created_by`
  - `created_at`, `updated_at`

- `purchase_items`
  - `id`
  - `purchase_id` (FK)
  - `supply_item_id` (FK)
  - `quantity`
  - `unit_cost`
  - `line_total`

### 3.4 Cuentas corrientes proveedor
- `supplier_account_entries`
  - `id`
  - `supplier_id` (FK)
  - `date`
  - `type` (`CHARGE`, `PAYMENT`, `CREDIT_NOTE`, `DEBIT_NOTE`)
  - `amount` (positivo)
  - `sign` (`+1` o `-1`) o derivado por tipo
  - `purchase_id` (nullable FK)
  - `payment_method` (nullable)
  - `reference`
  - `notes`
  - `created_by`
  - `created_at`

- (Opcional performance) `supplier_account_balances`
  - `supplier_id`
  - `balance`
  - `updated_at`

## 4) Reglas de negocio críticas
1. Nunca permitir stock negativo por operación manual o automática.
2. Una compra `RECEIVED` no se elimina; se revierte con movimiento contrario documentado.
3. Todo ajuste de stock requiere motivo obligatorio.
4. Los pagos no se editan; se corrigen con asiento de reversa.
5. La deuda en cuenta corriente nace solo si la compra es a crédito.
6. Cada asiento debe ser auditable (usuario y timestamp).

## 5) API/servicios (contrato mínimo)

### 5.1 Insumos
- `GET /supplies`
- `POST /supplies`
- `PATCH /supplies/:id`
- `GET /supplies/:id/movements`
- `POST /supplies/:id/movements` (ajustes manuales)

### 5.2 Compras
- `GET /purchases`
- `POST /purchases`
- `GET /purchases/:id`
- `PATCH /purchases/:id`
- `POST /purchases/:id/confirm`
- `POST /purchases/:id/receive` (impacta stock)
- `POST /purchases/:id/cancel`

### 5.3 Cuenta corriente proveedor
- `GET /suppliers/:id/account`
- `POST /suppliers/:id/account/payment`
- `POST /suppliers/:id/account/entry` (nota crédito/débito)
- `GET /suppliers/:id/account/statement?from=&to=`

## 6) Plan por fases (implementación incremental)

### Fase 0 - Preparación técnica
- Definir tipos TS en `src/types`.
- Definir capa API en `src/api`.
- Crear mocks o fixtures mínimos para UI inicial si backend no está listo.

### Fase 1 - Insumos base
- Pantalla listado + formulario alta/edición.
- Hook `useSupplies` con React Query.
- Validaciones básicas de formulario y unidad.
- Mostrar `current_stock` y alerta de `min_stock`.

Entregable: módulo usable de catálogo de insumos.

### Fase 2 - Compras base
- Pantalla listado de compras.
- Pantalla crear/editar compra con ítems.
- Cálculo de subtotal/impuestos/total en frontend y backend.
- Acción “Recibir compra” que genera movimientos `IN`.

Entregable: compras impactando stock correctamente.

### Fase 3 - Cuenta corriente
- Sección por proveedor con movimientos y saldo.
- Registrar pago parcial/total.
- Generación automática de `CHARGE` al recibir compra a crédito.
- Filtros por fecha y export básico (CSV/PDF opcional fase 4).

Entregable: trazabilidad financiera por proveedor.

### Fase 4 - Ajustes y cierre operativo
- Ajustes manuales de stock con auditoría.
- Reversas (asientos y contramovimientos) con permisos.
- Alertas de vencimientos y saldos críticos.
- Hardening de UX/errores/permisos.

Entregable: operación robusta para producción.

## 7) Integración con estructura actual del repo
Sugerencia de ubicación:
- `src/pages/Supplies.tsx`
- `src/pages/Purchases.tsx`
- `src/pages/SupplierAccount.tsx`
- `src/hooks/useSupplies.ts`
- `src/hooks/usePurchases.ts`
- `src/hooks/useSupplierAccount.ts`
- `src/types/supplies.ts`
- `src/types/purchases.ts`
- `src/types/supplier-account.ts`
- `src/api/supplies.ts`
- `src/api/purchases.ts`
- `src/api/supplier-account.ts`

Y rutas en `src/App.tsx`:
- `/supplies`
- `/purchases`
- `/suppliers/:supplierId/account`

## 8) Criterios de aceptación
1. Puedo crear insumo y ver stock mínimo/actual.
2. Puedo crear compra con varios ítems y total correcto.
3. Al recibir compra, aumenta stock y queda movimiento trazable.
4. Si compra es a crédito, aparece deuda en cuenta corriente.
5. Puedo registrar un pago y ver saldo actualizado.
6. No hay stock negativo ni acciones destructivas sin reversa.

## 9) Riesgos y mitigación
- Riesgo: divergencia entre stock agregado y movimientos.
  - Mitigación: stock se deriva o valida siempre contra movimientos.
- Riesgo: asientos manuales incorrectos.
  - Mitigación: tipos cerrados + validaciones + permisos.
- Riesgo: estados inválidos de compra.
  - Mitigación: máquina de estados simple (`DRAFT -> CONFIRMED -> RECEIVED` o `CANCELLED`).

## 10) Próximo paso recomendado
Implementar primero Fase 1 (Insumos base) y dejar listas las entidades de compras para no rehacer tipos/API después.
