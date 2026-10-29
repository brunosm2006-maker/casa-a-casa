# Casa a Casa

Fecha del primer borrador: 29 de octubre de 2026.

## Origen y objetivo

El proyecto nace de las dificultades que vivió su creador al adaptarse a la custodia compartida de sus padres. Quiere crear una aplicación pública que ayude a hijos, hijas, madres y padres a organizar las estancias y los cambios de casa.

Casa a Casa es el nombre definitivo elegido por el usuario. La aplicación está pensada para iPhone y Android.

## Ubicación de los archivos

Toda la información y todos los archivos futuros de este proyecto deben guardarse dentro de:

`C:\Users\pc\Documents\ChatGPT\Bruno\Casa a Casa`

La carpeta se ha renombrado por petición del usuario, conservando el proyecto y el repositorio. Esta ubicación sustituye la instrucción anterior de usar «Aplicación».

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

El primer uso sigue este recorrido: elegir Hijo, Hija, Madre o Padre → contestar un cuestionario de custodia → revisar las respuestas → confirmar y ver el calendario generado. Las plantillas no se guardan sin esa confirmación. Si se recarga antes de terminar, se vuelve al cuestionario sin aplicar la plantilla. Confirmar o elegir «Ahora no» completa la configuración inicial. La navegación ofrece Calendario, Rutina y Perfil. Las personas con un perfil de la versión anterior conservan su calendario y pueden acceder al cuestionario sin repetirlo en cada apertura.

Incluye rutina automática semanal y fines de semana alternos, navegación mensual, cambios puntuales para días o estancias, persistencia local y próximo cambio calculado con la rutina y sus excepciones. No se incluyen fechas de demostración como datos reales.

## Rutina automática y cambios puntuales

El cuestionario ofrece dos caminos:

- **Reparto semanal**: plantilla editable de lunes y martes con madre, miércoles y jueves con padre y viernes a domingo alternos. Cada día puede ajustarse; también puede dejarse sin asignar.
- **Fines de semana alternos**: un viernes a domingo cada dos semanas con el progenitor elegido. No requiere editar catorce días. Se pregunta por los días entre semana y los otros fines de semana; por defecto quedan sin asignar si no se definen.

En ambos casos se elige la fecha de inicio. Si hay alternancia, es obligatorio indicar un viernes de referencia y su progenitor. El formulario muestra el fin de semana fechado y permite definir con quién corresponden los otros fines de semana. La alternancia se ancla a esa fecha, continúa entre años y no se reinicia en enero. El calendario se calcula al consultar cada fecha, sin generar solo un año fijo.

Tras revisar las respuestas, «Guardar rutina y ver calendario» aplica la regla. «Ahora no» permite mantener el calendario manual. Se puede volver al cuestionario desde Rutina o desde «Cambiar rutina». Hay una sola regla activa: cambiarla recalcula sus fechas desde el inicio elegido y conserva todos los cambios puntuales.

Para festivos o vacaciones, toca un día o usa «Añadir cambio puntual». El cambio tiene prioridad sobre la rutina y solo afecta al tramo elegido. «Dejar sin asignar» crea una excepción vacía. «Quitar cambio puntual · recuperar rutina» elimina la excepción; si no hay rutina, el día vuelve a quedar vacío. Un asterisco marca los cambios puntuales. El próximo cambio solo aparece si dos días consecutivos tienen casas conocidas y distintas.

## Conservación de los datos anteriores

La versión anterior guardaba perfil y fechas en `custodia.calendario.v1`. La nueva versión lee primero `custodia.calendario.v2`; si no existe, lee y adapta la versión anterior sin modificarla. Todas las fechas anteriores pasan a ser cambios puntuales, con prioridad sobre cualquier rutina nueva. Los guardados nuevos usan la clave v2, con regla y excepciones, incluidas las excepciones vacías.

La clave v1 permanece intacta como copia del estado anterior. Volver al código anterior mostraría ese estado original, sin los cambios nuevos de v2. No se deben alternar versiones antiguas y nuevas para editar el mismo calendario. Los datos dañados muestran un error y no se sustituyen silenciosamente.

La vista del hijo indica con quién está hoy. Las vistas de madre y padre indican si su hijo o hija está con ellos y cuántos días tienen asignados en el mes. Todas permiten editar en este prototipo; esto no establece los permisos familiares definitivos.

## Cómo abrir la primera versión

Haz doble clic en `ABRIR.cmd` y abre [la aplicación local](http://127.0.0.1:8081). También puedes ejecutar `npm run preview` desde esta carpeta. La carpeta `dist` contiene la versión web ya compilada. El servidor debe permanecer abierto; puedes detenerlo con Ctrl+C. Si ya está abierto, basta con visitar la dirección. También puedes iniciar la vista de desarrollo con `npm run web`.

Para instalar de nuevo las dependencias, usa `npm ci`. Para recompilar la vista web, usa `npm run build:web`. Para preparar el desarrollo móvil, usa `npm start`; la prueba en un teléfono dependerá de disponer de un entorno Expo compatible. No se han creado cuentas ni instalado la aplicación en un teléfono.

Los datos se guardan en el almacenamiento local de la aplicación o del navegador. No se sincronizan entre dispositivos ni perfiles familiares reales. En web, conserva la misma dirección y el mismo navegador para recuperar los datos; borrar sus datos elimina el calendario. AsyncStorage no cifra el contenido. Esta primera versión sirve para revisión local.

## Verificación

- `npm test`: dieciocho pruebas de calendario, rutinas y persistencia, ejecutadas con la zona Europe/Madrid. Cubren ambos patrones, inicio, alternancia entre años, cambio de hora, excepciones, retirada de excepciones, migración de datos y fallos de almacenamiento.
- `npm run typecheck`: comprobación de TypeScript.
- `npm run build:web`: compilación web.
- `npm run build:native`: generación de los paquetes JavaScript/Hermes de iOS y Android en `dist-native`. Esto no equivale a compilar instaladores ni probar teléfonos físicos.
- `npm run test:browser`: ocho pruebas en Edge. Cubren el primer uso perfil → cuestionario → revisión → calendario, ambos patrones, configuración posterior, cambio de regla, excepciones, retirada de excepciones, migración, recarga, plantillas sin confirmar, errores y anchuras de 320, 768 y 1440 píxeles.

Las pruebas de navegador requieren Microsoft Edge instalado. Se revisó visualmente una captura móvil. Los detalles y las limitaciones están en [VERIFICACION.md](VERIFICACION.md), y los criterios visuales y fuentes oficiales en [DISEÑO.md](DISEÑO.md).

## Decisiones confirmadas

- El orden de trabajo será: primero la estructura de la aplicación y el calendario; después «Hoy y mañana»; por último, «Mochila». La estructura comprende organizar las pantallas y la navegación básica. Esta decisión sustituye la preferencia previa de empezar por «Hoy y mañana». La implementación de la primera fase ya está autorizada; su navegación inicial es provisional.
- En el registro se elegirá el perfil de hijo/hija o madre/padre. El perfil adaptará la vista y las opciones.
- Habrá un calendario que indique los días con cada progenitor y permita recordar los cambios de casa.
- La rutina automática y los cambios puntuales manuales para festivos o vacaciones están confirmados e implementados como parte prioritaria del calendario. El cuestionario inicial y su revisión son el recorrido principal; los rangos manuales se usan después para excepciones.
- La pantalla «Hoy y mañana» mostrará con quién está hoy el hijo o la hija, con quién estará mañana y cuándo será el próximo cambio de casa.
- El apartado «Mochila» permitirá preparar una lista personal para cada cambio de casa o estancia y marcar los elementos al prepararlos. La lista podrá reutilizarse y adaptarse a cada estancia. Podrá mostrarse desde «Hoy y mañana» cuando se acerque el cambio.
- El recordatorio del cambio de casa avisará el día anterior por defecto. Cada usuario podrá elegir otro momento para este recordatorio.
- El recordatorio de preparar la mochila avisará el día anterior por defecto. Cada usuario podrá elegir otro momento para este recordatorio de forma independiente.
- Ambos recordatorios se aplicarán tanto al ir con el padre como al ir con la madre. No se ha elegido una hora predeterminada.

## Propuesta de vistas por perfil

El borrador propone un calendario familiar con vistas adaptadas: el hijo o la hija ve con quién está cada día y el próximo cambio; el progenitor ve cuándo estará su hijo o hija con él o ella. La edición de fechas y la vinculación de cuentas siguen pendientes de concretar.

## Preguntas pendientes

- ¿Cómo evolucionarán las pantallas y la navegación básica a partir de la propuesta inicial Calendario/Perfil?
- ¿Quién podrá crear y editar las fechas del calendario?
- ¿Cómo se vincularán las cuentas familiares?
- ¿Qué hora se ofrecerá por defecto para cada aviso?
- ¿Quién podrá ver y modificar cada lista personal de «Mochila»?
- ¿Cómo se presentarán y gestionarán las listas y los avisos en cada perfil?

## Propuestas comentadas sin confirmar

- Confirmación o aprobación familiar de los cambios de vacaciones.
- Uso individual aunque el resto de la familia no tenga cuenta.

Estas propuestas no forman parte de los requisitos confirmados.

## Alcance actual

El trabajo autorizado comprende documentar e implementar la primera fase: estructura y calendario. Se ha elegido Expo y React Native como base compartida para esta versión. Las fases siguientes conservan el orden «Hoy y mañana» y después «Mochila»; sus pantallas completas siguen pendientes. Tampoco se han implementado avisos del sistema, cuentas familiares o sincronización. Los valores acordados de los recordatorios se conservan como requisitos futuros.

No se ha autorizado incorporar chat, ubicación o pagos; publicar la aplicación; crear un backend ni abrir cuentas en servicios.
