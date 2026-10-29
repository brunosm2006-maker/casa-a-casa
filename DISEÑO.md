# Criterios de esta primera interfaz

El calendario es la pantalla principal. Su acción principal es asignar una estancia. La navegación inicial tiene dos destinos: Calendario y Perfil. Es una estructura provisional para revisar, no una decisión cerrada sobre toda la aplicación.

Sin referencias visuales aportadas, se usa una dirección propia: fondo claro cálido, texto verde oscuro, días de madre en lavanda y de padre en ocre suave. Cada día incluye texto además de color. Las vistas se limitan a 760 puntos de ancho y mantienen siete columnas en móvil. Se emplea la tipografía del sistema, sin descargar fuentes ni imágenes.

La pantalla debe explicar el primer inicio vacío, los días sin asignar, los errores de lectura y de guardado, la edición y su cancelación. Los botones principales tienen 46 puntos de alto como mínimo; los días tienen 58 puntos de alto. En pantallas estrechas se conserva una etiqueta accesible completa para cada fecha.

El perfil hijo/hija consulta con quién está hoy. Los perfiles madre y padre consultan si su hijo o hija está con ellos y cuántos días tienen asignados en el mes. Todos pueden editar localmente de forma provisional; esto no define permisos familiares reales.

«Hoy y mañana» y «Mochila» se desarrollarán después, en ese orden. La primera fase no incluye sus pantallas ni las notificaciones del sistema.

Base técnica: Expo SDK 58, React Native y TypeScript, con AsyncStorage para persistir la selección de perfil y las fechas en el dispositivo. La vista web usa el mismo código. Fuentes oficiales consultadas:

- [Crear un proyecto Expo](https://docs.expo.dev/get-started/create-a-project/)
- [Vista web de Expo](https://docs.expo.dev/workflow/web/)
- [Almacenamiento local con AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)
