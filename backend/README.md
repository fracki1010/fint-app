# Backend AuthZ + Prisma Scaffold (Express)

Este backend incluye:
- JWT auth (`/api/auth/login`, `/api/auth/me`)
- autorización por roles/permisos
- módulos `supplies`, `purchases`, `supplier-account`
- persistencia con Prisma

## Ejecutar

```bash
cd backend
npm install
npm run db:push
npm run dev
```

Servidor: `http://localhost:5000`

## Endpoints
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST /api/supplies`
- `GET|POST /api/supplies/:id/movements`
- `GET|POST /api/purchases`
- `GET /api/purchases/:id`
- `POST /api/purchases/:id/confirm`
- `POST /api/purchases/:id/receive`
- `POST /api/purchases/:id/cancel`
- `GET /api/suppliers/:id/account`
- `POST /api/suppliers/:id/account/payment`
- `POST /api/suppliers/:id/account/entry`
- `GET /api/suppliers/:id/account/statement`

## Flujo operativo implementado
- `receivePurchase`:
  - genera movimientos `IN` de stock por cada ítem.
  - si la compra es `CREDIT`, crea asiento `CHARGE` automático.
  - transición obligatoria: `CONFIRMED -> RECEIVED`.

## Prisma
- schema: `backend/prisma/schema.prisma`
- datasource actual: SQLite (`DATABASE_URL=file:./dev.db`)
- para Postgres: cambiar `provider` y `DATABASE_URL`.

## Integración real recomendada
1. Reemplazar `auth.routes.ts` mock por login real contra DB.
2. Mantener reglas de negocio en `services/*`.
3. Si ya tienes ORM/repositories, mapear `services/*` a tus repos.
