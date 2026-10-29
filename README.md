# Proyecto de aplicación de custodia compartida

Fecha del primer borrador: 29 de octubre de 2026.

## Origen y objetivo

El proyecto nace de las dificultades que vivió su creador al adaptarse a la custodia compartida de sus padres. Quiere crear una aplicación pública que ayude a hijos, hijas, madres y padres a organizar las estancias y los cambios de casa.

La aplicación está pensada para iPhone y Android. Todavía no tiene nombre de producto: «Aplicación» es el nombre provisional de esta carpeta.

## Ubicación de los archivos

Toda la información y todos los archivos futuros de este proyecto deben guardarse dentro de:

`C:\Users\pc\Documents\ChatGPT\Bruno\Aplicación`

## Índice

- [BORRADOR.md](BORRADOR.md): primer borrador funcional para revisar con el usuario.
- [AGENTS.md](AGENTS.md): instrucción permanente sobre la ubicación de los archivos.
- [DISEÑO.md](DISEÑO.md): criterios de interfaz y base técnica.
- [VERIFICACION.md](VERIFICACION.md): comprobaciones y limitaciones.
- [ABRIR.cmd](ABRIR.cmd): abre el servidor de la versión local ya compilada.
- Este documento: registro de decisiones, preguntas y propuestas.

## Estado

El usuario ha autorizado empezar la implementación. Hay una primera versión funcional de la estructura y el calendario, construida con Expo, React Native y TypeScript. Comparte código entre iPhone, Android y la vista web local. «Calendario familiar» es una etiqueta descriptiva de la vista, no el nombre definitivo del producto.

Incluye navegación entre Calendario y Perfil; elección local de hijo/hija, madre o padre; navegación mensual; asignación, modificación y borrado de días o estancias; persistencia local y próximo cambio calculado a partir de dos días consecutivos con distinta casa. Los días sin asignar permanecen sin asignar. No se incluyen fechas de demostración.

La vista del hijo indica con quién está hoy. Las vistas de madre y padre indican si su hijo o hija está con ellos y cuántos días tienen asignados en el mes. Todas permiten editar en este prototipo; esto no establece los permisos familiares definitivos.

## Cómo abrir la primera versión

Haz doble clic en `ABRIR.cmd` y abre [la aplicación local](http://127.0.0.1:8081). También puedes ejecutar `npm run preview` desde esta carpeta. La carpeta `dist` contiene la versión web ya compilada. El servidor debe permanecer abierto; puedes detenerlo con Ctrl+C. Si ya está abierto, basta con visitar la dirección. También puedes iniciar la vista de desarrollo con `npm run web`.

Para instalar de nuevo las dependencias, usa `npm ci`. Para recompilar la vista web, usa `npm run build:web`. Para preparar el desarrollo móvil, usa `npm start`; la prueba en un teléfono dependerá de disponer de un entorno Expo compatible. No se han creado cuentas ni instalado la aplicación en un teléfono.

Los datos se guardan en el almacenamiento local de la aplicación o del navegador. No se sincronizan entre dispositivos ni perfiles familiares reales. En web, conserva la misma dirección y el mismo navegador para recuperar los datos; borrar sus datos elimina el calendario. AsyncStorage no cifra el contenido. Esta primera versión sirve para revisión local.

## Verificación

- `npm test`: once pruebas de calendario y persistencia, también ejecutadas con la zona Europe/Madrid. Cubren febrero bisiesto, límites de mes y año, cambio de hora, edición, borrado, fechas inválidas, huecos del calendario y fallos de almacenamiento.
- `npm run typecheck`: comprobación de TypeScript.
- `npm run build:web`: compilación web.
- `npm run build:native`: generación de los paquetes JavaScript/Hermes de iOS y Android en `dist-native`. Esto no equivale a compilar instaladores ni probar teléfonos físicos.
- `npm run test:browser`: cuatro pruebas en Edge. Verifican el flujo de selección por teclado, edición y borrado, persistencia al recargar, cambio de perfil, errores de almacenamiento y anchuras de 320, 768 y 1440 píxeles.

Las pruebas de navegador requieren Microsoft Edge instalado. Se revisó visualmente una captura móvil. Los detalles y las limitaciones están en [VERIFICACION.md](VERIFICACION.md), y los criterios visuales y fuentes oficiales en [DISEÑO.md](DISEÑO.md).

## Decisiones confirmadas

- El orden de trabajo será: primero la estructura de la aplicación y el calendario; después «Hoy y mañana»; por último, «Mochila». La estructura comprende organizar las pantallas y la navegación básica. Esta decisión sustituye la preferencia previa de empezar por «Hoy y mañana». La implementación de la primera fase ya está autorizada; su navegación inicial es provisional.
- En el registro se elegirá el perfil de hijo/hija o madre/padre. El perfil adaptará la vista y las opciones.
- Habrá un calendario que indique los días con cada progenitor y permita recordar los cambios de casa.
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
- ¿Qué nombre tendrá el producto?

## Propuestas comentadas sin confirmar

- Horarios que se repitan automáticamente.
- Gestión de vacaciones y cambios puntuales con confirmación.
- Uso individual aunque el resto de la familia no tenga cuenta.

Estas propuestas no forman parte de los requisitos confirmados.

## Alcance actual

El trabajo autorizado comprende documentar e implementar la primera fase: estructura y calendario. Se ha elegido Expo y React Native como base compartida para esta versión. Las fases siguientes conservan el orden «Hoy y mañana» y después «Mochila»; sus pantallas completas siguen pendientes. Tampoco se han implementado avisos del sistema, cuentas familiares o sincronización. Los valores acordados de los recordatorios se conservan como requisitos futuros.

No se ha autorizado incorporar chat, ubicación o pagos; publicar la aplicación; crear un backend ni abrir cuentas en servicios.
