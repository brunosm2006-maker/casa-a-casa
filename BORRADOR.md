# Casa a Casa · borrador funcional

Actualizado el 30 de octubre de 2026. Casa a Casa es el nombre definitivo elegido por el usuario. Borrador actualizado con la primera versión funcional de la estructura y el calendario. Las funciones de fases posteriores se describen como previstas.

Todos los archivos del proyecto se conservan en `C:\Users\pc\Desktop\Bruno\Casa a Casa`. Esta es la única carpeta principal y destino de todo trabajo futuro; sustituye las ubicaciones anteriores de Documentos.

## Objetivo

Ayudar a hijos, hijas, madres y padres a organizar la custodia compartida: consultar con quién toca estar, saber cuándo será el próximo cambio de casa y preparar lo que quieren llevar.

La idea nace de la experiencia personal de su creador al adaptarse a la custodia compartida de sus padres. Se plantea como una aplicación pública para iPhone y Android.

## Orden de trabajo confirmado

1. Primero, la estructura y el calendario, incluida como prioridad confirmada la rutina automática y los cambios puntuales. La navegación inicial tiene Calendario, Rutina y Perfil.
2. Después, la pantalla «Hoy y mañana».
3. Por último, «Mochila».

Este orden sustituye la preferencia previa de empezar por «Hoy y mañana». El usuario ya ha autorizado empezar la implementación de la primera fase. Se ha usado Expo y React Native para compartir la base entre iPhone, Android y la vista web local. La publicación sigue pendiente de autorización.

## Qué se puede probar ahora

Al abrir por primera vez se elige Hijo, Hija, Madre o Padre. Inmediatamente aparece un cuestionario sencillo sobre el reparto de custodia. Después se revisan las respuestas y se confirma la rutina para ver el calendario generado automáticamente. No hace falta rellenar las estancias de cada mes. Los perfiles guardados conservan su calendario y no repiten el cuestionario en cada apertura.

El cuestionario ofrece semanas alternas, turnos de 14 o 15 días, meses naturales, días fijos con fines de semana alternos, ciclos 2–2–3 / 2–2–5–5 / 3–4–4–3, un hogar habitual con estancias con el otro y reparto propio por bloques.

Solo se preguntan los datos del patrón elegido. Semanas y bloques empiezan cualquier día; los meses naturales, el día 1 y duran lo que dura cada mes. El viernes de referencia se pide únicamente cuando hay fines de semana alternos. Las rutinas anteriores conservan su anclaje y los días sin asignar.

A representa al primer progenitor. Los ciclos completos son:
- 2–2–3: A2, B2, A3, B2, A2, B3; invierte la segunda semana.
- 2–2–5–5: A2, B2, A5, B5; al empezar un lunes coincide con el ejemplo de días fijos y fines de semana alternos, empezando ese fin de semana con A.
- 3–4–4–3: A3, B4, A4, B3.

«Principalmente con uno» permite indicar hogar habitual, días completos con el otro y fines de semana semanales o alternos. Mantiene el caso de solo un fin de semana de cada dos dejando el resto sin asignar. Los días elegidos de lunes a jueves se repiten cada semana; la alternancia se aplica a los elegidos de viernes a domingo.

El reparto propio admite de 2 a 12 bloques, con 1 a 60 días enteros por bloque y hasta 90 días por ciclo. Debe incluir a ambos progenitores. Por ejemplo, nueve días con madre y cinco con padre.

Antes de confirmar se revisan dos ciclos completos, con fechas, texto y color. En meses naturales se ven cuatro meses reales. La vista incluye los cambios puntuales y explica la asignación habitual en esas fechas. No se guarda hasta confirmar.

Cada fecha representa una casa para el día completo y su noche. Esta fase no divide el día en horas, tardes o noches separadas. Las reglas continúan entre meses y años, también en años bisiestos y cambios de hora. Horarios, periodos de curso/vacaciones, casa nido y rutinas progresivas quedan para después.

Antes de confirmar no se carga la plantilla como horario real. Cada día muestra «Madre», «Padre» o una raya si está sin asignar, además de un color. El próximo cambio usa la rutina y los cambios puntuales; solo aparece cuando dos días consecutivos tienen casas conocidas y distintas. No se deducen estancias a través de días vacíos. Puede incluir un cambio previsto para hoy.

Para festivos, vacaciones u otros cambios se puede tocar una fecha o añadir un cambio puntual por rango. Solo se modifica ese tramo; fuera de él sigue la rutina. Las fechas usan DD/MM/AAAA y ambos extremos están incluidos. «Dejar sin asignar» mantiene el tramo vacío aunque haya rutina. «Quitar cambio puntual · recuperar rutina» retira la excepción para volver al patrón. Ambas acciones son distintas y se guardan localmente.

La rutina puede cambiarse desde Rutina o «Cambiar rutina». Hay una regla activa; al cambiarla se recalcula desde su fecha de inicio, sin eliminar las excepciones. Los días guardados con la primera versión se conservan como cambios puntuales y tienen prioridad sobre cualquier regla nueva. La copia original anterior se conserva; el formato nuevo guarda la regla y sus excepciones por separado.

La vista del hijo o hija muestra con quién está hoy. La de madre o padre indica si su hijo o hija está con él o ella y cuántos días tienen asignados este mes. El perfil se elige sin nombre ni cuenta. La edición local está disponible en todos los perfiles de forma provisional. Los permisos reales y la vinculación familiar siguen sin decidirse.

Para abrirla, ejecuta `npm run preview` desde la carpeta del proyecto y visita [la vista local](http://127.0.0.1:8081). Las instrucciones completas y comprobaciones están en [README.md](README.md) y [VERIFICACION.md](VERIFICACION.md). La persistencia es local, sin sincronización. No se han probado teléfonos físicos ni creado instaladores.

## Perfiles

Al registrarse, cada persona elegirá un perfil de hijo/hija o madre/padre. El perfil adaptará la vista y las opciones.

Como propuesta inicial, el hijo o la hija verá en el calendario con quién está cada día y cuándo cambia de casa. La madre o el padre verá cuándo estará su hijo o hija con él o ella.

Queda por decidir quién podrá editar las fechas y cómo se vincularán las cuentas de una familia.

## Funciones por fase

### Calendario

Ya genera automáticamente las estancias a partir del cuestionario y permite cambiar fechas concretas como excepciones. El cálculo continúa en los años siguientes; la vista y las fechas admitidas mantienen el intervalo 1900–2100. También conserva el uso manual si se decide no configurar una rutina.

### Hoy y mañana

Pendiente de la segunda fase.

Esta pantalla mostrará:

- Con quién está hoy el hijo o la hija.
- Con quién estará mañana.
- Cuándo será el próximo cambio de casa.

Cuando se acerque un cambio, también podrá mostrar la lista correspondiente de «Mochila» para empezar a prepararla.

### Mochila

Pendiente de la tercera fase.

Cada cambio de casa o estancia podrá tener una lista personal de lo que la persona quiere llevar. Los elementos se podrán marcar a medida que se preparen.

La lista podrá reutilizarse y adaptarse a cada estancia. Así se podrá partir de una lista anterior y añadir o quitar cosas según los días que se vayan a pasar en la otra casa.

Queda por concretar quién podrá ver y modificar las listas y cómo se gestionarán desde cada perfil.

### Recordatorios

Pendientes de implementar; esta versión no programa ni envía avisos del sistema.

Habrá un recordatorio para el cambio de casa y otro para preparar la mochila.

Los dos avisarán el día anterior por defecto. Cada usuario podrá elegir otro momento para cada uno de forma independiente. Este comportamiento se aplicará tanto al ir con el padre como al ir con la madre.

Todavía no se ha elegido una hora predeterminada para los avisos.

## Ejemplo de uso

Este ejemplo describe el funcionamiento previsto cuando estén disponibles todas las fases. Retoma la experiencia que contó el usuario: en verano pasaba quince días con cada progenitor. Las fechas y los avisos siguientes son ilustrativos y no están cargados en la aplicación.

El día 15 empieza una estancia con su padre. El hijo o la hija prepara una lista de «Mochila» para esa estancia. Puede reutilizar una lista anterior y adaptarla a lo que quiera llevar esta vez.

El día 14, «Hoy y mañana» muestra que mañana empieza la estancia con su padre y permite consultar la mochila correspondiente. Al preparar las cosas, va marcando los elementos de la lista.

Con la configuración predeterminada, el día 14 recibirá el recordatorio del cambio de casa y el de preparar la mochila. La hora queda pendiente de definir. Si cambia el momento de uno de los recordatorios, el otro conservará su propia configuración.

El mismo funcionamiento se aplicará cuando la siguiente estancia sea con su madre.

## Decisiones pendientes

- Cómo evolucionarán las pantallas y la navegación básica desde la propuesta inicial Calendario/Perfil.
- Quién crea y edita las fechas del calendario.
- Cómo se vinculan las cuentas familiares.
- Qué hora se ofrece por defecto para cada aviso.
- Quién puede ver y modificar las listas personales y cómo se presentan las listas y los avisos en cada perfil.

## Ideas para valorar más adelante

La rutina automática y las excepciones manuales de festivos o vacaciones ya están confirmadas e implementadas. Siguen sin confirmarse la aprobación familiar de cambios de vacaciones y el uso individual como funcionamiento definitivo aunque el resto de la familia no tenga cuenta. La edición local actual sirve para probar la aplicación.
