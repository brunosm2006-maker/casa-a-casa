# Casa a Casa · criterios de interfaz

«Casa a Casa» es el nombre definitivo. Se usa en la cabecera y en la configuración visible, conservando el diseño existente. El proyecto completo está en `C:\Users\pc\Desktop\Bruno\Casa a Casa`. El cambio de nombre no modifica las claves de almacenamiento ni el origen `http://127.0.0.1:8081`.

El primer uso sigue Perfil → cuestionario → revisión → calendario. La pregunta inicial es «¿Cómo os organizáis habitualmente?»; el texto de ayuda se adapta al perfil. Se mantienen la navegación, los colores y el diseño existentes.

El cuestionario ofrece seis caminos: semanas alternas, periodos más largos, días fijos con fines de semana alternos, ciclos de varios días, principalmente con uno y reparto personalizado. Solo se muestran los campos del patrón. El viernes de referencia se pide únicamente para fines de semana alternos.

La revisión muestra dos ciclos completos como tramos fechados con texto y color. Los meses naturales usan meses reales: cada ciclo contiene dos meses y la revisión muestra cuatro. Las excepciones aparecen con su asignación efectiva y la que tendría la rutina. El guardado requiere confirmación.

Las secuencias se explican antes de revisar: 2–2–3 invierte la segunda semana; 2–2–5–5 es A2/B2/A5/B5; 3–4–4–3 es A3/B4/A4/B3. El reparto personalizado mantiene un editor acotado: de 2 a 12 bloques, de 1 a 60 días por bloque y hasta 90 días en total.

Las fechas representan días completos con su noche. No hay controles de visitas por horas ni de noches separadas. Los días desconocidos se conservan sin asignar.

El cálculo usa fechas civiles: diferencias de días para bloques, diferencias de meses para meses naturales y el anclaje original para rutinas semanales. La búsqueda del próximo cambio cubre el periodo de cada patrón y las excepciones, en lugar de asumir catorce días.

Las rutinas anteriores mantienen sus datos. El editor evita convertirlas a un atajo que pierda turnos desconocidos. Las claves principales v1/v2 no cambian; se conserva una copia v2 anterior al primer guardado de bloques o meses. Las excepciones siguen teniendo prioridad y retirarlas recupera la rutina.

Sin referencias visuales aportadas, se usa una dirección propia: fondo claro cálido, texto verde oscuro, días de madre en lavanda y de padre en ocre suave. Cada día incluye texto además de color. Las vistas se limitan a 760 puntos de ancho y mantienen siete columnas en móvil. Se emplea la tipografía del sistema, sin descargar fuentes ni imágenes.

La pantalla debe explicar el primer inicio vacío, los días sin asignar, los errores de lectura y de guardado, la edición y su cancelación. Los botones principales tienen 46 puntos de alto como mínimo; los días tienen 58 puntos de alto. En pantallas estrechas se conserva una etiqueta accesible completa para cada fecha.

El perfil hijo/hija consulta con quién está hoy. Los perfiles madre y padre consultan si su hijo o hija está con ellos y cuántos días tienen asignados en el mes. Todos pueden editar localmente de forma provisional; esto no define permisos familiares reales.

«Hoy y mañana» y «Mochila» se desarrollarán después, en ese orden. La primera fase no incluye sus pantallas ni las notificaciones del sistema.

Base técnica: Expo SDK 58, React Native y TypeScript, con AsyncStorage para persistir la selección de perfil y las fechas en el dispositivo. La vista web usa el mismo código. Fuentes oficiales consultadas:

- [Crear un proyecto Expo](https://docs.expo.dev/get-started/create-a-project/)
- [Vista web de Expo](https://docs.expo.dev/workflow/web/)
- [Almacenamiento local con AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)
