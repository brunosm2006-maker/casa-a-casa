# Casa a Casa · criterios de interfaz

«Casa a Casa» es el nombre definitivo. Se usa en la cabecera y en la configuración visible, conservando el diseño existente. El proyecto completo está en `C:\Users\pc\Desktop\Bruno\Casa a Casa`. El cambio de nombre no modifica las claves de almacenamiento ni el origen `http://127.0.0.1:8081`.

El primer uso sigue el recorrido Perfil → cuestionario → revisión → calendario generado. Las opciones de perfil son Hijo, Hija, Madre y Padre. La pregunta inicial se adapta: «¿Con quién te toca cada día?» para hijos o «¿Cómo se reparte la custodia?» para progenitores. La navegación tiene Calendario, Rutina y Perfil. La rutina automática es el mecanismo principal; los rangos manuales se reservan para cambios puntuales.

El cuestionario tiene tres pasos: elegir el tipo de reparto, responder a las preguntas y revisar antes de guardar. Ofrece «Reparto semanal» y «Fines de semana alternos». La segunda opción resuelve un fin de semana cada dos sin configurar catorce celdas y mantiene sin asignar los días no definidos. Las plantillas no se guardan hasta confirmar. El viernes y el progenitor de referencia son campos explícitos, sin anclaje supuesto.

La regla se calcula por fechas civiles y ciclos de catorce días, sin depender del año ni de las horas de cambio de horario. Las excepciones tienen prioridad, incluida una excepción vacía. Retirar una excepción recupera la regla. El próximo cambio considera ambos niveles y requiere dos días consecutivos conocidos. No se crean aprobaciones familiares ni una base de festivos.

Una sola rutina activa se puede editar; la edición conserva las excepciones. Las personas que ya tenían perfil no repiten el cuestionario al abrir y mantienen sus fechas. La migración conserva la clave de almacenamiento original y escribe el formato nuevo en otra clave.

Sin referencias visuales aportadas, se usa una dirección propia: fondo claro cálido, texto verde oscuro, días de madre en lavanda y de padre en ocre suave. Cada día incluye texto además de color. Las vistas se limitan a 760 puntos de ancho y mantienen siete columnas en móvil. Se emplea la tipografía del sistema, sin descargar fuentes ni imágenes.

La pantalla debe explicar el primer inicio vacío, los días sin asignar, los errores de lectura y de guardado, la edición y su cancelación. Los botones principales tienen 46 puntos de alto como mínimo; los días tienen 58 puntos de alto. En pantallas estrechas se conserva una etiqueta accesible completa para cada fecha.

El perfil hijo/hija consulta con quién está hoy. Los perfiles madre y padre consultan si su hijo o hija está con ellos y cuántos días tienen asignados en el mes. Todos pueden editar localmente de forma provisional; esto no define permisos familiares reales.

«Hoy y mañana» y «Mochila» se desarrollarán después, en ese orden. La primera fase no incluye sus pantallas ni las notificaciones del sistema.

Base técnica: Expo SDK 58, React Native y TypeScript, con AsyncStorage para persistir la selección de perfil y las fechas en el dispositivo. La vista web usa el mismo código. Fuentes oficiales consultadas:

- [Crear un proyecto Expo](https://docs.expo.dev/get-started/create-a-project/)
- [Vista web de Expo](https://docs.expo.dev/workflow/web/)
- [Almacenamiento local con AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)
