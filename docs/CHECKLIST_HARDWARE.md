# Checklist de prueba en celular — Fint

Para probar la experiencia nativa de Fint en un teléfono real. Marcar cada punto como ✅ (ok), ❌ (falla) o ➖ (no aplica). Si falla, anotar la pantalla y los pasos.

## Datos de la prueba

| Campo | Valor |
| --- | --- |
| Fecha | |
| Probado por | |
| Dispositivo (modelo y año) | |
| Sistema operativo y versión | |
| Navegador (Safari / Chrome) | |
| Modo (pestaña / instalada como app) | |
| Versión de Fint (commit o fecha de build) | |

## Cómo conectar el teléfono

1. En la PC, desde la carpeta `fint-app`: `npm run dev -- --host`.
2. La PC y el teléfono deben estar en la misma red Wi-Fi.
3. En el teléfono, abrir `http://IP_DE_LA_PC:5173` (la IP la muestra la terminal de Vite).
4. iPhone: Ajustes → Safari → Avanzado → Inspector web, y desde la PC usar Safari → Desarrollo. Android: activar depuración USB y abrir `chrome://inspect` en Chrome de la PC.

## 1. Toque y feedback

- [ ] Al tocar un botón no aparece un flash azul o gris.
- [ ] Al tocar un botón, se ve una respuesta inmediata (la escala baja al presionar).
- [ ] Un botón que se tocó no queda "pegado" en estado hover.
- [ ] Las filas de listas y tarjetas no se agrandan ni se mueven al tocarlas.

## 2. Texto y selección

- [ ] Mantener presionado un botón no selecciona su texto ni abre el menú de copiar.
- [ ] Un importe, un número de orden o una dirección en pantalla sí se puede seleccionar y copiar.

## 3. Formularios y teclado

- [ ] Al enfocar cualquier campo de texto, la pantalla no hace zoom.
- [ ] Los campos numéricos abren el teclado numérico.
- [ ] Con el teclado abierto, el campo activo sigue visible.
- [ ] En los formularios de pantalla completa (clientes, productos, movimiento de caja), el botón de guardar no queda tapado por el teclado ni por la barra de inicio.

## 4. Scroll y rebote

- [ ] Tirar del borde superior no activa "pull to refresh" del navegador.
- [ ] Tirar del borde inferior no mueve toda la aplicación.
- [ ] Dentro de una lista o del menú lateral, el scroll rebota sin arrastrar el resto de la pantalla.

## 5. Menú lateral (drawer)

- [ ] Deslizar desde el borde izquierdo abre el menú siguiendo el dedo.
- [ ] Soltar a mitad de camino lo abre o lo cierra según el recorrido.
- [ ] Tocar el fondo oscuro cierra el menú.
- [ ] Dentro del menú, el scroll vertical funciona y no mueve el menú de costado.

## 6. Notificaciones (panel inferior)

- [ ] El panel sube desde abajo y se cierra al tocar fuera.
- [ ] El contenido del panel no queda debajo de la barra de inicio del teléfono.

## 7. Layout, safe areas y orientación

- [ ] El encabezado superior queda debajo de la barra de estado (hora, batería), sin tapar nada.
- [ ] La barra inferior de la pantalla (si aparece) no queda sobre el indicador de inicio.
- [ ] La pantalla ocupa toda la altura visible, sin una franja vacía abajo cuando la barra del navegador se oculta o se muestra.
- [ ] Girar a horizontal y volver a vertical no rompe el layout.

## 8. Carruseles y listas horizontales

- [ ] El carrusel de tarjetas del dashboard se desliza en horizontal y se acomoda en una tarjeta completa.
- [ ] Deslizar en horizontal dentro de una tabla o fila de chips no mueve la página hacia arriba o abajo.

## 9. Color y barra de estado

- [ ] Con el sistema en modo claro, la barra de estado tiene el mismo color que el encabezado.
- [ ] Con el sistema en modo oscuro, la barra de estado tiene el mismo color que el fondo oscuro.

## 10. App instalada (modo standalone)

- [ ] Instalar desde el navegador: iPhone → Compartir → Agregar a inicio. Android → Menú → Instalar aplicación.
- [ ] La app abre sin barra de navegador y con el nombre "Fint".
- [ ] El ícono de inicio se ve bien (no recortado, sin fondo blanco inesperado).
- [ ] Cerrar y volver a abrir la app mantiene la sesión y la última pantalla (si aplica).
- [ ] Sin conexión, la app muestra el indicador offline y no se rompe.

## 11. Rendimiento percibido

- [ ] Las transiciones de pantalla se sienten fluidas, sin saltos.
- [ ] El menú lateral y los modales abren sin tirones visibles.
- [ ] No hay parpadeos al cambiar de pestaña dentro de la app.

## Resumen

| Sección | Resultado | Notas |
| --- | --- | --- |
| 1. Toque y feedback | | |
| 2. Texto y selección | | |
| 3. Formularios y teclado | | |
| 4. Scroll y rebote | | |
| 5. Menú lateral | | |
| 6. Notificaciones | | |
| 7. Layout y safe areas | | |
| 8. Carruseles | | |
| 9. Color y barra de estado | | |
| 10. App instalada | | |
| 11. Rendimiento percibido | | |

**Conclusión:** ☐ Aprobado ☐ Aprobado con observaciones ☐ No aprobado
