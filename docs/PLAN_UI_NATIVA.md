# Plan: UI/UX con sensación nativa (PWA)

Objetivo: que Fint se sienta instalada en el celular, no un sitio dentro del navegador. Se trabaja en fases; cada fase cierra con verificación en hardware real.

## Diagnóstico (auditoría del código actual)

| Síntoma en el teléfono | Causa encontrada | Estado |
| --- | --- | --- |
| Flash azul/gris al tocar | Sin `-webkit-tap-highlight-color` | Corregido en fase 1 |
| Botones y textos se seleccionan con press largo | Sin `user-select` en controles | Corregido en fase 1 |
| Rebote / pull-to-refresh al tirar del borde | Sin `overscroll-behavior` | Corregido en fase 1 |
| Hover "pegado" tras tocar | Clases `.stat-card:hover`, `.list-row:hover`, `.hover-lift:hover`, `.financial-*:hover` sin gate | Corregido en fase 1 |
| Zoom al enfocar un input | Inputs bajo 16px en táctil; HeroUI fija el tamaño por clase | Corregido en fase 1 (con `!important` solo en `pointer: coarse`) |
| Layout con altura incorrecta (barra de URL) | `h-screen` (100vh) en la raíz de `MobileLayout` y en `Clients.tsx` | Parcial: raíz de `MobileLayout` a `h-dvh` |
| Dos meta viewport | `index.html` tenía dos; uno sin `viewport-fit=cover` | Corregido en fase 1 |
| Barra de estado no coincide | `theme_color` del manifest (`#0f172a`) distinto de la meta del HTML | Corregido en fase 1 (ahora `#F8F6F4`) |
| Feedback de toque tarde | Sin estado `:active` global; solo respuesta en `click` | Fase 2 |
| Páginas con `min-h-screen` / `h-screen` | Muchas páginas (ver lista abajo) | Fase 2 |
| Modales y drawers no respetan safe area en todos lados | Solo `MobileLayout` usa `safe-*` | Fase 2 |

## Fase 1 — Fundamentos (hecho en esta iteración)

1. `index.html`: un solo `viewport` con `viewport-fit=cover` e `interactive-widget=resizes-content`.
2. `src/styles/globals.css`: bloque "Native feel (mobile)":
   - `tap-highlight` transparente, `text-size-adjust`, `overscroll-behavior: none` en `html`.
   - `touch-action: manipulation` en botones, enlaces y `role="button"`.
   - `user-select: none` solo en controles (no en el texto de contenido).
   - Inputs a 16px en `(pointer: coarse)`.
3. Hovers agrupados en `@media (hover: hover) and (pointer: fine)`.
4. `MobileLayout.tsx`: raíz con `h-dvh`.
5. `vite.config.ts`: `theme_color` del manifest igual al fondo claro.

**Verificación pendiente en hardware** (no verificable desde código):
- Que el zoom al enfocar un input ya no ocurra en iOS Safari.
- Que el rebote del borde no mueva el shell en Android Chrome y iOS.
- Que el `!important` de inputs no rompa campos con tamaños intencionales (buscadores, badges).

## Fase 2 — Respuesta al toque y layout

- Estado `:active` global para controles táctiles (escala 0.97–0.98, 100–160 ms, `ease-out`), sin tocar hovers.
- Migrar `min-h-screen` y `h-screen` de páginas a `min-h-dvh` / `h-dvh`. Archivos: `Clients.tsx`, `Dashboard.tsx`, `Login.tsx`, `BankAccounts.tsx`, `BankTransactions.tsx`, `Reconciliation.tsx`, `CashClosing.tsx`, `InventorySnapshots.tsx`, `ClientAccountDetail.tsx`, `App.tsx`.
- Safe area en modales/drawers de pantalla completa (`ClientFormModal`, `ProductFormModal`, `CashMovementForm`) y en el panel de notificaciones inferior.
- Revisar `hover:` de Tailwind: en v4 ya compila a `@media (hover: hover)`, así que solo hay que revisar utilidades sueltas en TSX que dependan de hover para mostrar información.

### Estado de las fases 2 y 3

- Fase 2 aplicada: alturas `dvh` en 27 archivos, `:active` en botones, `safe-bottom` en drawers de pantalla completa.
- Fase 3 aplicada: `touch-pan-y` en drawer y borde, `transition-transform` en el panel, `snap-x` en el carrusel del dashboard. Pendiente: ~70 usos de `transition-all` fuera del shell.

## Fase 3 — Navegación y gestos

- Drawer lateral (`useDrawerGesture`): confirmar que el arrastre no compite con el scroll vertical (`touch-action: pan-y` en las listas, `none` solo en el handle).
- Carruseles o chips horizontales (si los hay): `scroll-snap` nativo en lugar de lógica JS.
- Transiciones entre pantallas: solo `transform` y `opacity`, nada de animar layout.

## Fase 4 — Identidad de app instalada

- Revisar `apple-mobile-web-app-status-bar-style` (hoy `default`) contra el header real; decidir `black-translucent` solo si el header pasa por debajo de la barra de estado.
- Splash screens y `apple-touch-icon` ya existen; validar tamaños en iPad y Android con modo standalone.
- Probar la app instalada (no solo en pestaña): standalone cambia viewport, safe areas y barra de estado.

## Fase 5 — Pruebas en hardware

Checklist por dispositivo (celular de unos años, no el más nuevo):
- Tocar botones: sin flash, con respuesta inmediata.
- Mantener presionado un botón: no selecciona el texto.
- Enfocar cada input: sin zoom.
- Tirar del borde superior e inferior: sin pull-to-refresh accidental.
- Con teclado abierto: los formularios de pantalla completa siguen usables.
- Rotar a horizontal una vez.
- Instalada como PWA en modo standalone.

Cómo conectar: `npm run dev -- --host` y abrir por IP de la PC; Safari → Desarrollo, o `chrome://inspect` en Android.

## Fuera de alcance de este plan

- Rediseño visual (paleta, tipografía, componentes). Se trata en un plan aparte con la skill de diseño.
- Animaciones complejas: se resuelven con la skill de animación cuando haga falta.
