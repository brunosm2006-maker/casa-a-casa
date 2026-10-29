# Verificación de la primera versión

29 de octubre de 2026. Entorno: Windows, Node 24.19.0, Expo SDK 58 y Microsoft Edge.

## Comprobaciones

- Once pruebas automatizadas de calendario y persistencia. Incluyen límites de mes y año, febrero bisiesto, tramo inclusivo que cruza el cambio de hora en Madrid, modificación y borrado parciales, validación de fechas, ausencia de cambios deducidos a través de huecos, recuperación al reabrir y propagación de errores de escritura. También se ejecutaron con `TZ=Europe/Madrid`.
- Se alteró temporalmente la condición del cambio de casa. Dos pruebas fallaron y detectaron el defecto; se restauró el código y las once volvieron a pasar.
- TypeScript: comprobación sin errores.
- Exportación web: compilación correcta de la misma aplicación React Native.
- Exportación iOS y Android: paquetes JavaScript/Hermes generados correctamente. El intento inicial dentro del entorno restringido falló en Hermes; la ejecución con los permisos de las herramientas nativas terminó correctamente. No se generaron IPA ni APK.
- Cuatro pruebas de navegador: calendario inicialmente vacío; selección de perfil por teclado; navegación mensual; rechazo de una fecha inexistente; estancia entre diciembre y enero; edición de un día; borrado parcial; próximo cambio; cambio de perfil; persistencia de estancias y perfil después de recargar; fallo de escritura sin éxito falso; datos dañados sin sobrescritura; anchuras de 320, 768 y 1440 píxeles.
- Revisión visual de una captura móvil de 390 × 844 píxeles. Los días incluyen etiquetas además del color y el calendario se desplaza verticalmente junto al resto de la pantalla.

## Limitaciones reales

Esta versión permite revisión local. No se ha probado en iPhone o Android físicos ni en un simulador. La exportación móvil comprueba que el código se empaqueta para ambas plataformas, pero queda pendiente validar allí los controles, el almacenamiento y la accesibilidad con lectores de pantalla.

No hay autenticación, cuentas vinculadas, sincronización ni permisos familiares reales. El perfil y la edición locales son supuestos provisionales para probar el producto. Los datos no se cifran y no tienen copia de seguridad. En navegador dependen del origen y del perfil de navegador usados; borrarlos elimina la información guardada.

«Hoy y mañana» y «Mochila» conservan su orden como siguientes fases. No hay notificaciones del sistema. Se mantienen documentados los dos avisos independientes, ambos el día anterior por defecto y sin hora predeterminada elegida.

La auditoría de dependencias informó de ocho entradas: cinco de severidad baja y tres alta, propagadas desde `deepmerge` y `zod` a las herramientas de Expo. No se fuerza la sustitución incompatible propuesta por el gestor a Expo 51. Queda pendiente resolver y repetir la auditoría con las versiones corregidas compatibles antes de preparar una publicación. No hay servidor público ni servicios remotos de la aplicación.

## Repetir las comprobaciones

En la carpeta del proyecto:

```powershell
npm ci
npm test
npm run typecheck
npm run build:web
npm run build:native
npm run test:browser
```

Las pruebas de navegador usan Edge y arrancan un servidor en `127.0.0.1:8081`. El servidor solo acepta conexiones locales. No requieren cuentas, teléfonos ni datos personales reales.
