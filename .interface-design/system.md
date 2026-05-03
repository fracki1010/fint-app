# Fint App — Sistema de diseño

## Dirección general

**Tema "Cobre"** — Cálido, vibrante, premium. Ámbar/cobre como primario sobre fondos entibiados. Rechaza el azul corporativo genérico.

## Paleta

Definida en `src/hero.ts` (plugin de HeroUI). Cambiar esos valores cascada a toda la app.

### Light
| Token | Valor |
|---|---|
| `primary` | `#D97706` (ámbar) |
| `background` | `#F8F6F4` (marfil) |
| `foreground` | `#1C1613` |
| `content1` | `#FFFFFF` |
| `content2` | `#F0ECE8` |
| `divider` | `rgba(100,70,40,0.12)` |

### Dark
| Token | Valor |
|---|---|
| `primary` | `#F59E0B` (ámbar brillante) |
| `background` | `#0C0908` (casi negro cálido) |
| `foreground` | `#F5F0EC` |
| `content1` | `#14110E` |
| `content2` | `#1C1814` |
| `divider` | `rgba(220,180,140,0.10)` |

## Border & glow system

Variables CSS en `globals.css`:
- `--warm-border` — RGB components para bordes sutiles (cambia por modo)
- `--warm-glow` — RGB components para glows/acentos (cambia por modo)
- `--warm-shadow` — RGB components para sombras (cambia por modo)

Uso: `rgb(var(--warm-border) / 0.12)`

## Depth strategy

Bordes + sombras sutiles. Sin colores de superficie dramáticos. Las elevaciones se sienten pero no se ven.

## Spacing

Base 4px (consistente con Tailwind/HeroUI). Sin valores aleatorios.

## Component patterns clave

- **Sidebar:** Mismo fondo que el canvas + borde de separación (`.app-panel`, `.app-topbar`)
- **Inputs:** Fondo ligeramente más oscuro que el entorno, foco con glow ámbar
- **Cards:** `border-radius: 20px`, borde sutil warm, shadow tenue
- **Badge/pill:** `border-radius: 999px`, texto bold 11px
- **Stat cards:** Hover con `translateY(-1px)` y glow intensificado
- **Slide-over panels:** Sombra izquierda cálida (`rgba(40,25,15,0.28)`)
- **Nav activo:** Borde/fondo con tinte primary + dot indicador

## Tokens de borde

| Contexto | Opacidad light | Opacidad dark |
|---|---|---|
| Separación suave | 0.08 | 0.06 |
| Borde estándar | 0.12-0.14 | 0.08-0.12 |
| Énfasis | 0.18-0.20 | 0.14-0.16 |
| Glow primary | 0.04-0.08 | 0.06-0.14 |
