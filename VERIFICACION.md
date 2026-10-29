# Casa a Casa · verificación

29 de octubre de 2026. Entorno: Windows, Node 24.19.0, Expo SDK 58 y Microsoft Edge.

## Ubicación definitiva en el Escritorio

La única carpeta principal y destino de todo trabajo futuro es `C:\Users\pc\Desktop\Bruno\Casa a Casa`, por petición expresa del usuario. Todas las ubicaciones anteriores en Documentos quedan sustituidas. No se ha tocado el otro proyecto del Bruno del Escritorio.

Se comprobaron las rutas exactas y que el destino no existiera. Se detuvo únicamente el acceso de apertura de Casa a Casa y su servidor identificado. El traslado con PowerShell y rutas literales conservó 22.585 archivos, incluidos los ocultos, el repositorio, dependencias, pruebas, recursos y accesos. Se verificó el mismo recuento antes y después, el mismo último commit, `git fsck` sin errores y ausencia de archivos pendientes antes de actualizar esta ubicación. La carpeta de origen ya no existe: no quedan dos proyectos activos.

No se modificaron las claves `custodia.calendario.v1` y `custodia.calendario.v2`, el código de persistencia ni el origen `http://127.0.0.1:8081`. Los identificadores internos de la aplicación se mantienen.

Desde el Escritorio se verificaron TypeScript, las dieciocho pruebas de lógica, la compilación web y las ocho pruebas de navegador. Se comprobó el acceso `ABRIR.cmd` con la ruta que contiene espacios, iniciado oculto, y la respuesta HTTP 200 con título «Casa a Casa». Las compilaciones móviles conservadas ya estaban verificadas en la entrega anterior; este traslado no modifica código móvil.

La base de datos no ha avanzado. La propuesta existente se conserva; siguen pendientes los permisos de consulta y edición de los hijos y la vinculación familiar.
## Comprobaciones

- Dieciocho pruebas automatizadas de calendario, rutinas y persistencia, ejecutadas con `TZ=Europe/Madrid`. A los casos de la primera versión se añaden: plantilla semanal; fines de semana alternos sin inventar los días desconocidos; fecha de inicio; turno antes y después del viernes de referencia; continuidad entre años y cambio de hora; prioridad de excepciones; diferencia entre excepción vacía y retirada de excepción; cambio de regla; retorno tras una excepción larga; rutina futura; migración v1 y persistencia v2 sin sobrescribir la copia anterior.
- Se alteró temporalmente la condición del cambio de casa. Dos pruebas fallaron y detectaron el defecto; se restauró el código y las once volvieron a pasar.
- En esta ampliación se invirtió temporalmente el turno de fines de semana. Cuatro pruebas detectaron el defecto; después se restauró la regla y las dieciocho pruebas volvieron a pasar.
- TypeScript: comprobación sin errores.
- Exportación web: compilación correcta de la misma aplicación React Native.
- Exportación iOS y Android: paquetes JavaScript/Hermes generados correctamente. El intento inicial dentro del entorno restringido falló en Hermes; la ejecución con los permisos de las herramientas nativas terminó correctamente. No se generaron IPA ni APK.
- Ocho pruebas de navegador en Edge. Mantienen los casos manuales y añaden: perfil → cuestionario → revisión → calendario; plantilla semanal y padre con un fin de semana de cada dos; validación de viernes y progenitor explícitos; consulta de enero sin reiniciar el turno; excepciones y retirada; cambio de regla sin borrar excepciones; recarga; calendario anterior conservado al configurar; plantilla sin confirmar que no se guarda; reanudación del primer uso incompleto y elección persistida de uso manual. Se comprueban anchuras de 320, 768 y 1440 píxeles en calendario, y 320 y 390 en el formulario semanal.
- Revisión visual de capturas móviles de 390 × 844 píxeles. La entrada al cuestionario muestra los dos caminos y la revisión precede al guardado. Los días incluyen etiquetas además del color y los cambios puntuales se marcan con asterisco.

## Limitaciones reales

Esta versión permite revisión local. No se ha probado en iPhone o Android físicos ni en un simulador. La exportación móvil comprueba que el código se empaqueta para ambas plataformas, pero queda pendiente validar allí los controles, el almacenamiento y la accesibilidad con lectores de pantalla.

No hay autenticación, cuentas vinculadas, sincronización ni permisos familiares reales. El perfil y la edición locales son supuestos provisionales para probar el producto. Los datos no se cifran ni tienen copia de seguridad de los cambios nuevos; la migración conserva la clave v1 original. En navegador dependen del origen y del perfil de navegador usados; borrarlos elimina la información guardada.

Se admite una sola rutina activa. Cambiarla recalcula sus fechas desde el inicio elegido y conserva las excepciones; no hay historial de reglas con distintas fechas de vigencia. La alternancia disponible es de fines de semana de viernes a domingo, cada dos semanas; no se implementan ciclos arbitrarios. Las fechas admitidas mantienen el intervalo 1900–2100 y cada cambio puntual puede abarcar hasta 366 días. Los días no definidos permanecen sin asignar.

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
