# 🛒 Plan de Integración: Compras, Insumos, Debe/Haber y Artículos

## 📋 Estado Actual

### ✅ Backend — YA EXISTE (100% listo)

| Módulo                                      | Modelo                          | Controller                     | Rutas                      | Estado                      |
| ------------------------------------------- | ------------------------------- | ------------------------------ | -------------------------- | --------------------------- |
| **Compras**                                 | `purchase.model.js`             | `purchaseController.js`        | `purchaseRoutes.js`        | ✅ Completo                 |
| **Insumos**                                 | `supply.model.js`               | `supplyController.js`          | `supplyRoutes.js`          | ✅ Completo                 |
| **Movimientos Insumo**                      | `supplyMovement.model.js`       | En `supplyController.js`       | En `supplyRoutes.js`       | ✅ Completo                 |
| **Cuenta Corriente Proveedor (Debe/Haber)** | `supplierAccountEntry.model.js` | `supplierAccountController.js` | `supplierAccountRoutes.js` | ✅ Completo                 |
| **Artículos (Productos)**                   | `product.model.js`              | `productController.js`         | `productRoutes.js`         | ✅ Ya integrado en frontend |

### ❌ Frontend — NO EXISTE (0%)

No hay **ninguna** referencia a `purchase`, `supply` ni `supplier` en el frontend (`fint-app/src`).  
Todo el trabajo es en el **frontend**.

---

## 🏗️ PLAN DE IMPLEMENTACIÓN

### FASE 1: Capa de Datos (Hooks + Types)

> Estimación: ~2 horas

#### 1.1 — Tipos TypeScript (`src/types/`)

Crear `src/types/purchasing.ts` con las interfaces:

```typescript
// Insumo
interface Supply {
  _id: string;
  name: string;
  sku: string | null;
  unit: string;
  currentStock: number;
  minStock: number;
  referenceCost: number;
  isActive: boolean;
}

// Movimiento de Insumo
interface SupplyMovement {
  _id: string;
  supply: Supply | string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  sourceType: string;
  createdAt: string;
}

// Item de Compra
interface PurchaseItem {
  supply: Supply | string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

// Compra
interface Purchase {
  _id: string;
  supplier: Client; // reutiliza tipo Client existente
  date: string;
  status: "DRAFT" | "CONFIRMED" | "RECEIVED" | "CANCELLED";
  paymentCondition: "CASH" | "CREDIT";
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  items: PurchaseItem[];
  receivedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

// Asiento Cuenta Corriente Proveedor (Debe/Haber)
interface SupplierAccountEntry {
  _id: string;
  supplier: string;
  date: string;
  type: "CHARGE" | "PAYMENT" | "CREDIT_NOTE" | "DEBIT_NOTE";
  amount: number;
  sign: 1 | -1;
  purchase: string | null;
  paymentMethod: string;
  reference: string;
  notes: string;
  createdAt: string;
}

interface SupplierAccount {
  entries: SupplierAccountEntry[];
  balance: number;
}
```

#### 1.2 — Hook `useSupplies.ts` (`src/hooks/`)

- `useSupplies()` — lista todos los insumos
- `useCreateSupply()` — crear insumo
- `useUpdateSupply()` — editar insumo
- `useDeleteSupply()` — soft-delete insumo
- `useSupplyMovements(supplyId)` — movimientos de un insumo
- `useCreateSupplyMovement(supplyId)` — registrar IN/OUT/ADJUST

**Endpoints usados:**
| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/supplies` | Listar insumos |
| POST | `/supplies` | Crear insumo |
| PATCH | `/supplies/:id` | Actualizar insumo |
| DELETE | `/supplies/:id` | Desactivar insumo |
| GET | `/supplies/:id/movements` | Movimientos |
| POST | `/supplies/:id/movements` | Registrar movimiento |

#### 1.3 — Hook `usePurchases.ts` (`src/hooks/`)

- `usePurchases()` — lista todas las compras
- `usePurchase(id)` — detalle de una compra
- `useCreatePurchase()` — crear orden de compra
- `useConfirmPurchase()` — confirmar compra (DRAFT → CONFIRMED)
- `useReceivePurchase()` — recibir compra (CONFIRMED → RECEIVED, actualiza stock insumos)
- `useCancelPurchase()` — cancelar compra

**Endpoints usados:**
| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/purchases` | Listar compras |
| GET | `/purchases/:id` | Detalle compra |
| POST | `/purchases` | Crear compra |
| POST | `/purchases/:id/confirm` | Confirmar |
| POST | `/purchases/:id/receive` | Recibir (mueve stock) |
| POST | `/purchases/:id/cancel` | Cancelar |

#### 1.4 — Hook `useSupplierAccount.ts` (`src/hooks/`)

- `useSupplierAccount(supplierId)` — cuenta corriente del proveedor
- `useSupplierStatement(supplierId, from, to)` — estado de cuenta por rango
- `useCreatePayment(supplierId)` — registrar pago al proveedor
- `useCreateAccountEntry(supplierId)` — registrar nota crédito/débito

**Endpoints usados:**
| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/suppliers/:id/account` | Cuenta corriente |
| GET | `/suppliers/:id/account/statement` | Estado de cuenta |
| POST | `/suppliers/:id/account/payment` | Registrar pago |
| POST | `/suppliers/:id/account/entry` | Nota crédito/débito |

---

### FASE 2: Página de Insumos

> Estimación: ~3 horas

Crear `src/pages/Supplies.tsx` con las siguientes secciones:

#### 2.1 — Listado de Insumos (tabla principal)

- Tabla con columnas: SKU, Nombre, Unidad, Stock Actual, Stock Mínimo, Costo Ref., Estado
- **Indicador visual** de stock bajo (rojo si `currentStock < minStock`)
- Filtros: búsqueda por nombre/SKU, filtro activos/inactivos
- Acciones por fila: Editar, Desactivar, Ver movimientos

#### 2.2 — Modal Crear/Editar Insumo

- Campos: Nombre, SKU, Unidad (select), Stock inicial, Stock mínimo, Costo referencia
- Validación en frontend

#### 2.3 — Panel de Movimientos de Insumo (drawer lateral)

- Al hacer click en un insumo → drawer derecho con historial de movimientos
- Cada movimiento: tipo (IN/OUT/ADJUST), cantidad, stock antes/después, razón, fecha
- Botón "Registrar movimiento manual" → mini-form tipo/cantidad/razón

#### 2.4 — Ruta

```
/supplies → Supplies.tsx
```

---

### FASE 3: Página de Compras

> Estimación: ~4 horas

Crear `src/pages/Purchases.tsx` con dos vistas:

#### 3.1 — Listado de Compras

- Tabla: #, Proveedor, Fecha, Estado (chip color), Condición Pago, Total, Acciones
- Filtros: por estado, por proveedor, por fecha
- Chips de estado con colores:
  - 🟡 DRAFT | 🔵 CONFIRMED | 🟢 RECEIVED | 🔴 CANCELLED

#### 3.2 — Detalle de Compra (drawer o vista embebida)

- Datos del proveedor
- Items de la compra (insumo, cantidad, costo unitario, total línea)
- Subtotal, impuesto, total
- Notas
- **Barra de acciones contextuales:**
  - DRAFT → botón "Confirmar" + "Cancelar"
  - CONFIRMED → botón "Recibir" + "Cancelar"
  - RECEIVED → solo lectura
  - CANCELLED → solo lectura

#### 3.3 — Modal Nueva Compra

- Selector de proveedor (autocomplete del listado de clientes)
- Fecha
- Condición de pago (CASH / CREDIT)
- Tabla de items:
  - Selector de insumo (autocomplete)
  - Cantidad, costo unitario → lineTotal calculado
  - Agregar/quitar líneas
- Subtotal, impuesto (%), total (calculado automático)
- Notas

#### 3.4 — Ruta

```
/purchases → Purchases.tsx
/purchases/:purchaseId → Purchases.tsx (detalle)
```

---

### FASE 4: Cuenta Corriente Proveedor (Debe/Haber)

> Estimación: ~3 horas

Integrado dentro de la **vista de detalle de cliente/proveedor** en `Clients.tsx`, o como sección en una nueva página.

#### 4.1 — Pestaña/Sección "Cuenta Corriente"

- Visible cuando un cliente actúa como proveedor
- **Tabla de movimientos** con columnas:
  - Fecha | Tipo | Descripción | Debe | Haber | Saldo Acumulado
- Tipos:
  - 🔴 CHARGE (Debe) — cargo por compra a crédito
  - 🟢 PAYMENT (Haber) — pago realizado
  - 🔴 DEBIT_NOTE (Debe) — nota de débito
  - 🟢 CREDIT_NOTE (Haber) — nota de crédito
- **Saldo total** destacado visualmente (positivo = debemos, negativo = a favor)

#### 4.2 — Modal Registrar Pago

- Monto, método de pago, referencia, fecha, notas

#### 4.3 — Modal Registrar Nota Crédito/Débito

- Tipo (CREDIT_NOTE / DEBIT_NOTE), monto, referencia, fecha, notas

#### 4.4 — Filtro por Rango de Fechas

- Filtros desde/hasta para el estado de cuenta

---

### FASE 5: Navegación e Integración

> Estimación: ~1 hora

#### 5.1 — Actualizar Rutas en `App.tsx`

```tsx
<Route element={<SuppliesPage />} path="/supplies" />
<Route element={<PurchasesPage />} path="/purchases" />
<Route element={<PurchasesPage />} path="/purchases/:purchaseId" />
```

#### 5.2 — Actualizar Navegación

- Agregar items al menú lateral/bottom nav:
  - 📦 Insumos → `/supplies`
  - 🛒 Compras → `/purchases`
- Puede ir dentro de un grupo "Compras" en el menú

#### 5.3 — Links Cruzados

- Desde detalle de compra → link al proveedor
- Desde detalle de proveedor → ver compras del proveedor
- Desde detalle de insumo → ver compras que incluyen ese insumo
- Desde detalle de compra recibida → ver movimientos de stock generados

---

### FASE 6: Dashboard y Financiero (Opcional)

> Estimación: ~2 horas

#### 6.1 — Widgets en Dashboard

- Total cuentas por pagar a proveedores
- Alertas de insumos con stock bajo
- Última compra recibida

#### 6.2 — Módulo Financiero

- Incluir gastos de compras en los estados contables
- Agregar sección "Cuentas por Pagar" en el dashboard financiero

---

## 📊 Resumen del Plan

| Fase  | Descripción                   | Archivos Nuevos               | Estimación     |
| ----- | ----------------------------- | ----------------------------- | -------------- |
| **1** | Types + Hooks (capa de datos) | 4 archivos                    | ~2h            |
| **2** | Página de Insumos             | 1 página + componentes        | ~3h            |
| **3** | Página de Compras             | 1 página + componentes        | ~4h            |
| **4** | Cuenta Corriente (Debe/Haber) | Extensión de Clients + modals | ~3h            |
| **5** | Navegación + rutas            | Ediciones en App.tsx, navbar  | ~1h            |
| **6** | Dashboard + Financiero        | Ediciones existentes          | ~2h (opcional) |

**Total estimado: ~13-15 horas de desarrollo**

---

## 🔄 Orden de Ejecución Recomendado

```
FASE 1 (Types + Hooks) → Obligatorio primero
    ↓
FASE 2 (Insumos) → Independiente
FASE 3 (Compras) → Depende de Fase 2 (selector de insumos)
    ↓
FASE 4 (Debe/Haber) → Depende de Fase 3 (vinculación compras)
    ↓
FASE 5 (Navegación) → Integrar todo
    ↓
FASE 6 (Dashboard) → Opcional, mejora final
```

## 🎨 Diseño Propuesto

La UI debe seguir el mismo patrón visual de las páginas existentes (`Products.tsx`, `Sales.tsx`, `Clients.tsx`):

- Usar componentes HeroUI (Table, Modal, Drawer, Chip, Button, Input, Autocomplete)
- Mismo esquema de colores del theme
- Layout responsivo mobile-first
- Chips de colores para estados
- Acciones contextuales por fila
- Drawers para detalle
- Modales para crear/editar
