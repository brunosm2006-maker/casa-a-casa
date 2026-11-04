# Casa a Casa

Fecha del primer borrador: 29 de octubre de 2026.

## Origen y objetivo

El proyecto nace de las dificultades que vivió su creador al adaptarse a la custodia compartida de sus padres. Quiere crear una aplicación pública que ayude a hijos, hijas, madres y padres a organizar las estancias y los cambios de casa.

Casa a Casa es el nombre definitivo elegido por el usuario. La aplicación está pensada para iPhone y Android.

## Ubicación de los archivos

Toda la información y todos los archivos futuros de este proyecto deben guardarse dentro de:

`C:\Users\pc\Desktop\Bruno\Casa a Casa`

El proyecto completo se ha trasladado al Bruno del Escritorio por petición expresa del usuario. Esta es la única carpeta principal y el destino de todo trabajo futuro. Sustituye todas las ubicaciones anteriores de Documentos, sin dejar otra copia activa.

## Índice

- [BORRADOR.md](BORRADOR.md): primer borrador funcional para revisar con el usuario.
- [AGENTS.md](AGENTS.md): instrucción permanente sobre la ubicación de los archivos.
- [DISEÑO.md](DISEÑO.md): criterios de interfaz y base técnica.
- [VERIFICACION.md](VERIFICACION.md): comprobaciones y limitaciones.
- [BASE_DE_DATOS.md](BASE_DE_DATOS.md): propuesta de tablas para compartir los calendarios; pendiente de revisar, sin conexión a una base real.
- [ABRIR.cmd](ABRIR.cmd): abre el servidor de la versión local ya compilada.
- Este documento: registro de decisiones, preguntas y propuestas.

## Estado

Hay una primera versión funcional de Casa a Casa, con estructura y calendario, construida con Expo, React Native y TypeScript. Comparte código entre iPhone, Android y la vista web local.

El primer uso sigue este recorrido: elegir Hijo, Hija, Madre o Padre → contestar un cuestionario de custodia → revisar las respuestas → confirmar y abrir Hoy y mañana con el calendario generado. Las plantillas no se guardan sin esa confirmación. Si se recarga antes de terminar, se vuelve al cuestionario sin aplicar la plantilla. Confirmar o elegir «Ahora no» completa la configuración inicial. La navegación ofrece Hoy y mañana, Calendario, Mochila, Rutina y Perfil. Las personas con un perfil de la versión anterior conservan su calendario y pueden acceder al cuestionario sin repetirlo en cada apertura.

Incluye las plantillas ampliadas y el reparto personalizado, navegación mensual, cambios puntuales para días o estancias, persistencia local y próximo cambio calculado con la rutina y sus excepciones. No se incluyen fechas de demostración como datos reales.

## Hoy y mañana

Es la pantalla habitual al abrir un perfil ya configurado y después de confirmar una rutina. Muestra las estancias previstas para hoy y mañana y el próximo cambio de casa. Usa las mismas rutinas y excepciones del calendario, sin duplicar el cálculo ni inventar datos.

Para hijos e hijas indica con qué progenitor está prevista la estancia. Para madres y padres indica si su hijo o hija tiene una estancia prevista con ese progenitor. No hay nombres reales ni cuentas vinculadas. Un día sin asignar permanece desconocido; no se atribuye al otro progenitor.

Si el cambio está previsto para hoy se expresa así, sin hora. Si no existen dos días consecutivos con casas conocidas y distintas, se explica que aún no puede determinarse el próximo cambio. Si falta rutina se ofrece configurarla, conservando el uso de fechas manuales.

La pantalla permite abrir el calendario y cambiar la rutina. La navegación mantiene accesibles Hoy y mañana, Calendario, Mochila, Rutina y Perfil. Los cambios guardados y la selección de perfil se reflejan inmediatamente. Las fechas usan el día local del dispositivo y se actualizan a medianoche y al volver a la aplicación; en web también al recuperar foco o visibilidad. Hay una comprobación periódica de respaldo.

Son previsiones del calendario, no ubicación en tiempo real. Se mantienen los días completos, sin horarios internos. Mochila aparece junto al próximo cambio el día anterior y el mismo día. Permite crear o abrir la lista correspondiente y consultar su progreso.

## Mochila

Permite crear listas para fechas actuales o futuras con destino conocido en el calendario efectivo, incluidas las excepciones. La lista guarda esa fecha y destino; no supone el inicio, el final ni la duración de una estancia. Si falta destino, ofrece completar la fecha en el calendario.

Cada lista permite añadir, editar, marcar y eliminar objetos. Muestra preparados y pendientes; una lista vacía no figura como completada. La eliminación de objetos y de listas pide confirmación. Puedes empezar con una lista anterior: se copian los textos con identificadores nuevos y todos los objetos pendientes. El original conserva sus marcas.

Hay una lista por fecha y destino. Si el calendario cambia después, se conserva la asociación original y se muestra una advertencia. Puedes crear otra lista para el destino nuevo sin perder la anterior. Hoy y mañana solo abre la que coincide con la fecha y destino del próximo cambio, el día anterior o el mismo día.

El guardado usa una clave independiente, custodia.mochilas.v1. Si no existe, se empieza sin listas, sin modificar el calendario, el perfil ni el primer uso. Un error de lectura bloquea la edición de Mochila y permite seguir usando el calendario. Un fallo de guardado conserva los datos guardados y el texto que estabas editando. Se admiten hasta 100 listas, 100 objetos por lista y 120 caracteres por objeto.

Todos los perfiles usan las mismas listas locales de este calendario. Esto no decide los permisos familiares definitivos. Las listas se guardan en este dispositivo.

## Recordatorios

En Perfil puedes activar por separado el aviso de cambio de casa y el de preparar la mochila. Ambos empiezan desactivados, con el horario inicial propuesto de un día antes a las 18:00 en la zona del dispositivo. Puedes elegir de 0 a 7 días antes y otra hora. La app móvil pide permiso al pulsar «Permitir notificaciones». En web se guardan los ajustes para probarlos en ese navegador.

La app móvil revisa los cambios de hoy y los 29 días siguientes. Recalcula al abrir o volver a la app y cuando se guardan ajustes, cambios de calendario o listas. Solo programa horas futuras. El aviso de mochila requiere una lista sin completar para la misma fecha y destino del cambio. Si el cambio deja de aplicar, se completa o elimina la lista, o se desactiva un aviso, se retiran los avisos correspondientes. Abre la app periódicamente para renovar la ventana.

Los mensajes del sistema son genéricos. Android puede aplazar el aviso según los ajustes del dispositivo. Las preferencias se guardan en una clave local separada. La implementación usa Expo Notifications con el SDK 58. La entrega se debe comprobar en teléfonos físicos. [Documentación de Expo Notifications](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/).

## Rutina automática y cambios puntuales

El cuestionario empieza con «¿Cómo os organizáis habitualmente?» y ofrece seis opciones:

| Opción | Reparto disponible |
| --- | --- |
| Semanas alternas | Siete días con cada progenitor, desde cualquier día elegido. |
| Periodos más largos | Turnos de 14 o 15 días o meses naturales alternos. Los meses empiezan el día 1 y terminan el último día real del mes; no son bloques de 30 días. |
| Días fijos y fines de semana alternos | Mantiene el ejemplo lunes/martes madre, miércoles/jueves padre y viernes a domingo alternos. Cada día puede ajustarse o dejarse sin asignar. |
| Ciclos de varios días | 2–2–3, 2–2–5–5 y 3–4–4–3, con fecha y primer progenitor elegibles. |
| Principalmente con uno | Progenitor habitual o resto sin asignar, días completos con el otro y fines de semana semanales o alternos. |
| Crear mi propio reparto | Bloques que se repiten, por ejemplo nueve días con madre y cinco con padre. |

Solo los patrones con fines de semana alternos piden un viernes de referencia. Los demás empiezan el día elegido. En los ciclos, A es el primer progenitor y B el otro:

- 2–2–3: A2 → B2 → A3 → B2 → A2 → B3. La segunda semana invierte el reparto.
- 2–2–5–5: A2 → B2 → A5 → B5. Al empezar un lunes coincide con lunes/martes A, miércoles/jueves B y fines de semana alternos, empezando el fin de semana con A.
- 3–4–4–3: A3 → B4 → A4 → B3.

Antes de confirmar se muestran dos ciclos completos en tramos con fechas incluidas, texto y color. Un ciclo reúne todo el patrón antes de repetirse: en semanas alternas dura 14 días; en meses naturales son dos meses, por lo que se revisan cuatro meses reales. La vista incluye las excepciones guardadas y explica qué diría la rutina en esas fechas.

Cada fecha asigna una casa para el día completo y su noche. No se separan horas, tardes o noches de un mismo día. En «Principalmente con uno», los días seleccionados de lunes a jueves se repiten semanalmente; la alternancia se aplica a los días seleccionados de viernes a domingo. El resto permanece sin asignar si no se define.

«Guardar rutina» aplica el patrón. «Ahora no» conserva el uso manual. Las plantillas sin confirmar no se guardan. La rutina puede editarse después. Hay una sola regla activa, sin historial de varias reglas con distintas vigencias; cambiarla recalcula desde su inicio y conserva las excepciones.

Para festivos o vacaciones se toca una fecha o se usa «Añadir cambio puntual». «Dejar sin asignar» crea una excepción vacía. «Quitar cambio puntual · recuperar rutina» retira la excepción y vuelve al patrón. Las excepciones siempre prevalecen, incluso al cambiar de plantilla. El próximo cambio requiere dos días consecutivos con casas conocidas y distintas; la búsqueda cubre bloques largos y meses, sin limitarse a catorce días.

El reparto personalizado admite de 2 a 12 bloques, de 1 a 60 días enteros por bloque, hasta 90 días por ciclo e incluye a ambos progenitores. Las fechas admitidas siguen en 1900–2100 y se debe poder mostrar la revisión completa dentro de ese intervalo. Cada excepción por rango admite hasta 366 días.

Horarios dentro del día, periodos de curso/vacaciones, casa nido y rutinas progresivas quedan para fases posteriores.

## Conservación de los datos anteriores

La versión anterior guardaba perfil y fechas en `custodia.calendario.v1`. La nueva versión lee primero `custodia.calendario.v2`; si no existe, lee y adapta la versión anterior sin modificarla. Todas las fechas anteriores pasan a ser cambios puntuales, con prioridad sobre cualquier rutina nueva. Los guardados nuevos usan la clave v2, con regla y excepciones, incluidas las excepciones vacías.

La clave v1 permanece intacta como copia del estado anterior. Volver al código anterior mostraría ese estado original, sin los cambios nuevos de v2. No se deben alternar versiones antiguas y nuevas para editar el mismo calendario. Los datos dañados muestran un error y no se sustituyen silenciosamente.

La vista del hijo indica con quién está hoy. Las vistas de madre y padre indican si su hijo o hija está con ellos y cuántos días tienen asignados en el mes. Todas permiten editar en este prototipo; esto no establece los permisos familiares definitivos.

Las rutinas semanales anteriores se siguen leyendo sin cambiar sus días ni su viernes de referencia, incluidos los turnos desconocidos. Si «Principalmente con uno» no puede representarlas exactamente, se conserva su editor semanal.

Se mantienen las claves principales v1/v2 y el origen local. Los nuevos tipos distinguen semanal, ciclo por bloques y meses naturales. Antes del primer guardado de un ciclo por bloques o meses se conserva el v2 anterior en la clave custodia.calendario.v2.pre-plantillas, si ya existía y aún no hay copia. No se sobrescribe esa copia en guardados posteriores. Si no se puede conservar, no se sobrescribe el calendario. Es una copia local puntual, no un respaldo remoto.

La versión antigua no puede leer los tipos nuevos de bloques y meses. Para volver a ella habría que recuperar explícitamente el estado anterior; no se deben alternar versiones antiguas y nuevas para editar.

## Cómo abrir Casa a Casa

Haz doble clic en `ABRIR.cmd` y abre [la aplicación local](http://127.0.0.1:8081). También puedes ejecutar `npm run preview` desde esta carpeta. La carpeta `dist` contiene la versión web ya compilada. El servidor debe permanecer abierto; puedes detenerlo con Ctrl+C. Si ya está abierto, basta con visitar la dirección. También puedes iniciar la vista de desarrollo con `npm run web`.

Para instalar de nuevo las dependencias, usa `npm ci`. Para recompilar la vista web, usa `npm run build:web`. Para preparar el desarrollo móvil, usa `npm start`; la prueba en un teléfono dependerá de disponer de un entorno Expo compatible. No se han creado cuentas ni instalado la aplicación en un teléfono.

Los datos se guardan en el almacenamiento local de la aplicación o del navegador. No se sincronizan entre dispositivos ni perfiles familiares reales. En web, conserva la misma dirección y el mismo navegador para recuperar los datos; borrar sus datos elimina el calendario. AsyncStorage no cifra el contenido. Esta primera versión sirve para revisión local.


Los campos de inicio de rutina, viernes de referencia y fechas inicial/final de cambios puntuales añaden las barras automáticamente: 30102026 se muestra como 30/10/2026. Admiten pegado con o sin separadores, hasta ocho dígitos, y conservan el borrado y la edición del cursor. La validación de fechas reales permanece activa.

## Verificación

- `npm test`: 53 pruebas de calendario, fechas locales, edición de fechas, rutinas, Mochila y persistencia, ejecutadas con la zona Europe/Madrid. Cubren todas las plantillas, meses naturales, años bisiestos, búsqueda de cambios largos, vista previa, excepciones, migración y copia del estado anterior.
- `npm run typecheck`: comprobación de TypeScript.
- `npm run build:web`: compilación web.
- `npm run build:native`: generación de los paquetes JavaScript/Hermes de iOS y Android en `dist-native`. Esto no equivale a compilar instaladores ni probar teléfonos físicos.
- `npm run test:browser`: 26 pruebas en Edge. Cubren el primer uso perfil → cuestionario → revisión → calendario, semanas, quince días, meses naturales, ciclos, reparto propio, configuración posterior, cambio de regla, excepciones, retirada de excepciones, migración, recarga, plantillas sin confirmar, errores, listas de Mochila, copia con marcas pendientes y anchuras de 320, 768, 1280 y 1440 píxeles.

Las pruebas de navegador requieren Microsoft Edge instalado. Se revisó visualmente una captura móvil. Los detalles y las limitaciones están en [VERIFICACION.md](VERIFICACION.md), y los criterios visuales y fuentes oficiales en [DISEÑO.md](DISEÑO.md).

## Decisiones confirmadas

- El orden de trabajo será: primero la estructura de la aplicación y el calendario; después «Hoy y mañana»; por último, «Mochila». La estructura comprende organizar las pantallas y la navegación básica. Esta decisión sustituye la preferencia previa de empezar por «Hoy y mañana». La implementación de la primera fase ya está autorizada; su navegación inicial es provisional.
- En el registro se elegirá el perfil de hijo/hija o madre/padre. El perfil adaptará la vista y las opciones.
- Habrá un calendario que indique los días con cada progenitor y permita recordar los cambios de casa.
- La rutina automática y los cambios puntuales manuales para festivos o vacaciones están confirmados e implementados como parte prioritaria del calendario. El cuestionario inicial y su revisión son el recorrido principal; los rangos manuales se usan después para excepciones.
- La pantalla «Hoy y mañana» ya muestra con quién está hoy el hijo o la hija, con quién estará mañana y cuándo será el próximo cambio de casa.
- El apartado «Mochila» ya permite preparar listas por fecha y destino, marcar objetos y copiar listas anteriores. Aparece desde «Hoy y mañana» el día anterior y el mismo día del próximo cambio.
- El recordatorio del cambio de casa avisará el día anterior por defecto. Cada usuario podrá elegir otro momento para este recordatorio.
- El recordatorio de preparar la mochila avisará el día anterior por defecto. Cada usuario podrá elegir otro momento para este recordatorio de forma independiente.
- Ambos recordatorios se aplicarán tanto al ir con el padre como al ir con la madre. La hora inicial propuesta es 18:00 local y se puede editar.

## Propuesta de vistas por perfil

El borrador propone un calendario familiar con vistas adaptadas: el hijo o la hija ve con quién está cada día y el próximo cambio; el progenitor ve cuándo estará su hijo o hija con él o ella. La edición de fechas y la vinculación de cuentas siguen pendientes de concretar.

## Preguntas pendientes

- ¿Cómo evolucionarán las pantallas y la navegación básica a partir de la propuesta inicial Calendario/Perfil?
- ¿Quién podrá crear y editar las fechas del calendario?
- ¿Cómo se vincularán las cuentas familiares?
- ¿Quién podrá ver y modificar cada lista personal de «Mochila»?
- ¿Cómo se presentarán y gestionarán las listas y los avisos en cada perfil?

## Propuestas comentadas sin confirmar

- Confirmación o aprobación familiar de los cambios de vacaciones.
- Uso individual aunque el resto de la familia no tenga cuenta.

Estas propuestas no forman parte de los requisitos confirmados.

## Alcance actual

El trabajo autorizado incluye estructura, calendario, Hoy y mañana y Mochila, ya implementados. Se ha elegido Expo y React Native como base compartida para esta versión. El alcance incluye avisos locales en la app móvil. Las cuentas familiares y la sincronización siguen pendientes.

No se ha autorizado incorporar chat, ubicación o pagos; publicar la aplicación; crear un backend ni abrir cuentas en servicios.
