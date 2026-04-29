# Checklist ejecutable: Insumos, Compras y Cuentas Corrientes

## Cómo usar este checklist
- Marca cada tarea al completarla.
- Ejecuta validaciones al final de cada fase.
- No avances de fase si falla algún criterio de aceptación.

---

## Fase 0 - Base técnica

### 0.1 Tipos y contratos
- [ ] Crear [src/types/supplies.ts](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/types/supplies.ts)
- [ ] Definir `SupplyItem`, `SupplyStockMovement`, `SupplyUnit`, `SupplyMovementType`
- [ ] Crear [src/types/purchases.ts](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/types/purchases.ts)
- [ ] Definir `Purchase`, `PurchaseItem`, `PurchaseStatus`, `PaymentCondition`
- [ ] Crear [src/types/supplier-account.ts](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/types/supplier-account.ts)
- [ ] Definir `SupplierAccountEntry`, `SupplierAccountEntryType`, `SupplierBalance`
- [ ] Exportar tipos desde [src/types/index.ts](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/types/index.ts)

### 0.2 Capa API
- [ ] Crear [src/api/supplies.ts](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/api/supplies.ts)
- [ ] Implementar: `getSupplies`, `createSupply`, `updateSupply`, `getSupplyMovements`, `createSupplyMovement`
- [ ] Crear [src/api/purchases.ts](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/api/purchases.ts)
- [ ] Implementar: `getPurchases`, `getPurchaseById`, `createPurchase`, `updatePurchase`, `confirmPurchase`, `receivePurchase`, `cancelPurchase`
- [ ] Crear [src/api/supplier-account.ts](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/api/supplier-account.ts)
- [ ] Implementar: `getSupplierAccount`, `createSupplierPayment`, `createSupplierAccountEntry`, `getSupplierStatement`

### 0.3 Hooks con React Query
- [ ] Crear [src/hooks/useSupplies.ts](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/hooks/useSupplies.ts)
- [ ] Crear [src/hooks/usePurchases.ts](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/hooks/usePurchases.ts)
- [ ] Crear [src/hooks/useSupplierAccount.ts](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/hooks/useSupplierAccount.ts)
- [ ] Definir query keys estables para invalidaciones (`supplies`, `purchases`, `supplierAccount`)

### 0.4 Validación fase 0
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Verificar que no rompe imports existentes

---

## Fase 1 - Módulo Insumos

### 1.1 UI de listado y alta/edición
- [ ] Crear [src/pages/Supplies.tsx](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/pages/Supplies.tsx)
- [ ] Tabla con: nombre, unidad, stock actual, stock mínimo, estado
- [ ] Formulario alta/edición con validaciones
- [ ] Estado visual de stock bajo mínimo

### 1.2 Movimientos manuales
- [ ] Sección/modal para ajustes de stock
- [ ] Campos obligatorios: tipo (`IN|OUT|ADJUST`), cantidad, motivo
- [ ] Bloqueo de egreso que deje stock negativo

### 1.3 Rutas y navegación
- [ ] Agregar ruta `/supplies` en [src/App.tsx](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/App.tsx)
- [ ] Agregar acceso en navbar [src/components/navbar.tsx](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/components/navbar.tsx)

### 1.4 Criterios aceptación fase 1
- [ ] Crear insumo funciona
- [ ] Editar insumo funciona
- [ ] Ajuste de stock crea movimiento
- [ ] Nunca permite stock negativo

### 1.5 Validación fase 1
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Prueba manual: alta + ajuste IN + ajuste OUT

---

## Fase 2 - Módulo Compras

### 2.1 UI de compras
- [ ] Crear [src/pages/Purchases.tsx](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/pages/Purchases.tsx)
- [ ] Listado con filtros básicos (estado/proveedor/fecha)
- [ ] Formulario compra (cabecera + detalle de ítems)
- [ ] Estados visibles: `DRAFT`, `CONFIRMED`, `RECEIVED`, `CANCELLED`

### 2.2 Lógica de totales
- [ ] Cálculo `line_total = qty * unit_cost`
- [ ] Cálculo `subtotal`, `tax`, `total`
- [ ] Validación de redondeo monetario consistente

### 2.3 Recepción e impacto stock
- [ ] Acción `receivePurchase` en UI
- [ ] Al recibir: registrar `supply_stock_movements` tipo `IN`
- [ ] Actualizar stock de cada insumo afectado

### 2.4 Rutas y navegación
- [ ] Agregar ruta `/purchases` en [src/App.tsx](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/App.tsx)
- [ ] Agregar acceso en navbar [src/components/navbar.tsx](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/components/navbar.tsx)

### 2.5 Criterios aceptación fase 2
- [ ] Crear compra multi-ítem funciona
- [ ] Cambiar estados funciona y respeta transición válida
- [ ] Recibir compra aumenta stock correctamente
- [ ] Compra recibida no se elimina directamente

### 2.6 Validación fase 2
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Prueba manual: compra -> receive -> verificar stock

---

## Fase 3 - Cuentas Corrientes Proveedores

### 3.1 UI cuenta corriente
- [ ] Crear [src/pages/SupplierAccount.tsx](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/pages/SupplierAccount.tsx)
- [ ] Vista de movimientos por proveedor
- [ ] Mostrar saldo actual y saldo al corte
- [ ] Filtros por fecha/tipo

### 3.2 Asientos automáticos y manuales
- [ ] Al recibir compra `CREDIT`, crear asiento `CHARGE`
- [ ] Registrar pago parcial/total (`PAYMENT`)
- [ ] Registrar notas crédito/débito
- [ ] Implementar reversas en vez de edición destructiva

### 3.3 Rutas
- [ ] Agregar ruta `/suppliers/:supplierId/account` en [src/App.tsx](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/App.tsx)
- [ ] Enlace desde pantalla de proveedores [src/pages/Clients.tsx](/mnt/A20073E00073B9BD/react-apps/fint-app-complete/fint-app/src/pages/Clients.tsx)

### 3.4 Criterios aceptación fase 3
- [ ] Compra a crédito impacta deuda
- [ ] Pago reduce saldo correctamente
- [ ] Estado de cuenta refleja cronología correcta
- [ ] Saldos consistentes contra asientos

### 3.5 Validación fase 3
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] Prueba manual: compra crédito + pago parcial + pago final

---

## Fase 4 - Hardening y operación

### 4.1 Permisos y seguridad funcional
- [ ] Definir quién puede ajustar stock
- [ ] Definir quién puede cancelar/revertir compras
- [ ] Definir quién puede cargar notas de crédito/débito

### 4.2 Auditoría
- [ ] Mostrar `created_by` y `created_at` en movimientos críticos
- [ ] Logging mínimo de acciones críticas

### 4.3 UX y reportes
- [ ] Alertas de stock bajo
- [ ] Alertas de proveedores con saldo vencido
- [ ] Export simple de cuenta corriente (CSV)

### 4.4 Criterios aceptación fase 4
- [ ] Sin acciones destructivas sin trazabilidad
- [ ] Operación diaria posible sin inconsistencias
- [ ] Flujo end-to-end validado por usuario final

---

## Backlog opcional (después del MVP)
- [ ] Recepción parcial de compras por ítem
- [ ] Costeo promedio ponderado de insumos
- [ ] Consumo automático de insumos por venta/producción
- [ ] Dashboard KPI: rotación de insumos, días de inventario, deuda total proveedores

---

## Comandos de control por fase
- `npm run test`
- `npm run build`
- `npm run ci` (cuando se corrija lint para ignorar `dev-dist`)

## Definición de Done global
- [ ] Flujo completo: alta insumo -> compra -> recepción -> deuda -> pago
- [ ] No hay stock negativo
- [ ] No hay edición destructiva de asientos
- [ ] Tipado y compilación sin errores
- [ ] Validación funcional manual completada
