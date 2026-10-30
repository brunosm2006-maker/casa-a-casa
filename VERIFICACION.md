# Casa a Casa · verificación

Actualizado el 30 de octubre de 2026. Entorno: Windows, Node 24.19.0, Expo SDK 58 y Microsoft Edge.

## Ubicación definitiva y comprobación del traslado del 29 de octubre

La única carpeta principal y destino de todo trabajo futuro es `C:\Users\pc\Desktop\Bruno\Casa a Casa`, por petición expresa del usuario. Todas las ubicaciones anteriores en Documentos quedan sustituidas. No se ha tocado el otro proyecto del Bruno del Escritorio.

Se comprobaron las rutas exactas y que el destino no existiera. Se detuvo únicamente el acceso de apertura de Casa a Casa y su servidor identificado. El traslado con PowerShell y rutas literales conservó 22.585 archivos, incluidos los ocultos, el repositorio, dependencias, pruebas, recursos y accesos. Se verificó el mismo recuento antes y después, el mismo último commit, `git fsck` sin errores y ausencia de archivos pendientes antes de actualizar esta ubicación. La carpeta de origen ya no existe: no quedan dos proyectos activos.

No se modificaron las claves `custodia.calendario.v1` y `custodia.calendario.v2`, el código de persistencia ni el origen `http://127.0.0.1:8081`. Los identificadores internos de la aplicación se mantienen.

Desde el Escritorio se verificaron TypeScript, las dieciocho pruebas de lógica, la compilación web y las ocho pruebas de navegador. Se comprobó el acceso `ABRIR.cmd` con la ruta que contiene espacios, iniciado oculto, y la respuesta HTTP 200 con título «Casa a Casa». Las compilaciones móviles conservadas ya estaban verificadas en la entrega anterior; este traslado no modifica código móvil.

La base de datos no ha avanzado. La propuesta existente se conserva; siguen pendientes los permisos de consulta y edición de los hijos y la vinculación familiar.
## Comprobaciones de la ampliación del 30 de octubre

- 31 pruebas de lógica y persistencia con TZ=Europe/Madrid. Cubren los casos anteriores y las secuencias reales e invertidas de 2–2–3, 2–2–5–5 y 3–4–4–3; equivalencia de 2–2–5–5 con el ejemplo semanal; semanas y 14/15 días entre años; meses con febrero bisiesto; 9/5 y cambio de hora; límites del editor; dos ciclos de revisión; cambios futuros más allá de catorce días; excepciones y retorno; lectura de v1/v2; copia anterior, fallos de copia y turnos desconocidos.
- Se introdujo temporalmente un límite incorrecto de catorce días en la búsqueda. La prueba de bloque largo falló. Se restauró el código y las 31 pruebas pasaron.
- TypeScript sin errores.
- Exportación web y paquetes JavaScript/Hermes para iOS y Android correctos. No son instaladores ni pruebas en teléfonos físicos.
- 15 pruebas en Edge. Conservan primer uso, reanudación, uso manual, excepciones, recarga y errores. Añaden semanas empezando un miércoles, quince días sobre febrero bisiesto, meses naturales con inicio en día 1, dos ciclos fechados, 2–2–5–5, editor 9/5, hogar habitual con un día fijo y fin de semana alterno, y edición de una rutina v2 anterior sin perder un turno desconocido.
- La prueba de edición posterior detectó que el estado seleccionado de los controles nuevos no se comunicaba al navegador. Se corrigió con una propiedad de accesibilidad compatible y pasó sin cambiar la selección guardada.
- Revisión visual de capturas móviles de ciclos y meses naturales. Se muestran fechas completas, texto y los colores existentes. Se mantienen las pruebas de anchuras de 320, 768 y 1440 en calendario y 320 y 390 en formularios.
- No hay dependencias ni servicios nuevos. El origen local se mantiene en http://127.0.0.1:8081.

## Limitaciones reales

Esta versión permite revisión local. No se ha probado en iPhone o Android físicos ni en un simulador. La exportación móvil comprueba que el código se empaqueta para ambas plataformas, pero queda pendiente validar allí los controles, el almacenamiento y la accesibilidad con lectores de pantalla.

No hay autenticación, cuentas vinculadas, sincronización ni permisos familiares reales. El perfil y la edición locales son supuestos provisionales para probar el producto. Los datos no se cifran ni se respaldan fuera del dispositivo. Se conserva la clave v1 original y la copia local puntual de v2 anterior a los patrones ampliados. En navegador dependen del origen y del perfil de navegador usados; borrarlos elimina la información guardada.

Se admite una sola rutina activa. Cambiarla recalcula desde el inicio y conserva las excepciones; no hay historial de reglas con distintas vigencias.

Fechas de 1900 a 2100 y cambios puntuales de hasta 366 días. El reparto personalizado tiene de 2 a 12 bloques, de 1 a 60 días enteros por bloque y hasta 90 días por ciclo, e incluye a ambos progenitores. Los dos ciclos de revisión deben caber en el intervalo admitido.

Los meses naturales empiezan el día 1 y alternan meses completos, sin meses parciales implícitos. Los ciclos 2–2–3, 2–2–5–5 y 3–4–4–3 duran catorce días y muestran sus secuencias completas.

Cada fecha representa el día completo y su noche. No se separan horas, tardes o noches de un mismo día. Periodos de curso/vacaciones, casa nido, rutinas progresivas y visitas por horas quedan pendientes. En «Principalmente con uno», los días elegidos de lunes a jueves son semanales; la alternancia afecta a los elegidos de viernes a domingo.

Las rutinas anteriores conservan su forma y los días desconocidos. Antes del primer guardado de bloques o meses se conserva el v2 anterior en custodia.calendario.v2.pre-plantillas, si existe y aún no hay copia; los guardados siguientes no la sustituyen. La versión antigua no entiende esos tipos nuevos: recuperar el estado anterior sería una acción explícita y no se deben mezclar versiones para editar.

Hoy y mañana está implementada; Mochila sigue pendiente. No hay notificaciones del sistema. Se mantienen documentados los dos avisos independientes, ambos el día anterior por defecto y sin hora predeterminada elegida.

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

## Ajuste de entrada de fechas del 30 de octubre

Un campo común añade barras al escribir, filtra los separadores pegados y limita a ocho dígitos. Se utiliza en inicio de rutina, viernes de referencia de ambos recorridos y fechas inicial/final de cambios puntuales. El cálculo de rutinas y las claves de guardado no cambian.

Cinco pruebas nuevas cubren escritura secuencial, pegado con barras/guiones/puntos/espacios, límite de dígitos, retroceso y borrado junto a una barra, sustitución del mes con cursor intermedio, limpieza del campo y rechazo de fechas inexistentes. Una prueba nueva de navegador reproduce esas acciones y guarda un cambio puntual. Pasan 36 pruebas de lógica, las 16 de navegador y TypeScript. Se reconstruyó la vista web y se generaron correctamente los paquetes de iPhone y Android. La prueba física del teclado en iPhone y Android sigue pendiente.

## Hoy y mañana: comprobaciones del 30 de octubre

La pantalla está integrada como inicio habitual de perfiles configurados y tras confirmar una rutina. Conserva el uso manual inicial y las pestañas Calendario, Rutina y Perfil. Reutiliza el cálculo efectivo existente; no hay lógica de reparto duplicada ni cambios en las claves de guardado.

Pasan 41 pruebas de lógica y 20 de navegador. Las cinco nuevas de lógica cubren fin de año, febrero bisiesto, día sin asignar, excepciones, cambios previstos para hoy, cambios lejanos y duración local hasta medianoche, incluida una jornada de cambio de hora. Las cuatro nuevas de navegador verifican los cuatro perfiles, medianoche de fin de año, vuelta a foco y visibilidad, excepción guardada, cambio de rutina y estados sin información. Las comprobaciones anteriores se mantienen, navegando al calendario desde el nuevo inicio.

TypeScript, exportación web y paquetes JavaScript/Hermes de iPhone y Android correctos. Se revisaron visualmente capturas de Hoy y mañana a 320 y 1280 píxeles, sin desbordamiento horizontal. La barra muestra las cuatro pantallas y las tarjetas conservan el lenguaje visual existente.

La fecha usa el reloj local del dispositivo. Se programa un refresco a la próxima medianoche, se refresca al activar la aplicación y en web al recuperar foco o visibilidad. Una comprobación cada treinta segundos sirve de respaldo. Los cambios internos guardados se reflejan de inmediato.

Son previsiones del calendario; no hay ubicación real, horas del cambio, nombres de hijos inventados ni sincronización familiar. No se han añadido listas o acciones de Mochila, notificaciones reales, servicios ni base de datos. Los permisos familiares siguen pendientes. Falta la prueba de reanudación y presentación en teléfonos físicos; la exportación móvil no sustituye esa prueba.
