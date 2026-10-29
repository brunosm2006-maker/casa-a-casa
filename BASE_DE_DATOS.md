# Casa a Casa · propuesta inicial de datos

29 de octubre de 2026. Propuesta para revisar. No se ha elegido proveedor, conectado una base de datos, creado servicios remotos ni implementado SQL o un backend.

## Cuándo hace falta

Para probar Casa a Casa en un solo dispositivo basta el guardado local actual. Ya permite configurar una rutina, conservar excepciones y recuperar el calendario al abrir de nuevo.

Para que madres, padres e hijos consulten el mismo calendario desde distintos teléfonos se justifica una base compartida, con cuentas y control de acceso. Ese es el objetivo de la aplicación pública. No hace falta conectarla antes de acordar quién podrá consultar y modificar cada calendario.

## Tres conceptos distintos

- **Cuenta de acceso**: permite iniciar sesión. Se reutilizaría el sistema del proveedor elegido, sin duplicar su tabla de autenticación ni guardar contraseñas en tablas propias.
- **Miembro familiar**: representa a una persona dentro de una familia. Puede ser hijo, hija, madre o padre. Puede existir sin cuenta; por ejemplo, un hijo pequeño cuyo calendario organizan sus progenitores. Una cuenta puede estar vinculada a miembros de distintas familias.
- **Hogar**: es una de las casas de una estancia. No es una cuenta ni un perfil. Se identifica con una etiqueta, sin necesitar una dirección física. Ser madre o padre no concede por sí solo un permiso de edición.

## Tablas mínimas propuestas

| Tabla | Para qué sirve | Datos principales orientativos |
| --- | --- | --- |
| `familias` | Agrupar a las personas y hogares relacionados. | Identificador y nombre opcional de la familia. |
| `miembros_familiares` | Representar a hijos, hijas y progenitores, tengan cuenta o no. | Familia, nombre de uso, perfil y referencia opcional a la cuenta del proveedor. |
| `hogares` | Identificar las casas entre las que se organiza la custodia. | Familia y etiqueta de la casa. No se deduce el hogar a partir del perfil de una cuenta. |
| `calendarios` | Dar a cada hijo o hija su propio horario. | Familia y miembro que representa al hijo o hija. Inicialmente, un calendario por hijo. |
| `rutinas_custodia` | Guardar la regla habitual de un calendario sin crear una fila por cada día futuro. | Calendario, fecha de inicio, reparto por día de la semana, viernes de referencia y hogares de los dos turnos alternos. |
| `excepciones_calendario` | Guardar cambios puntuales para vacaciones, festivos u otros días. | Calendario, fecha y hogar elegido, que puede quedar vacío de forma explícita. Una excepción por calendario y fecha. |

Los campos son orientativos, no un esquema cerrado. El reparto semanal podría guardarse como una estructura de siete entradas dentro de la rutina. Cada entrada indicaría hogar fijo, turno alterno o día sin asignar. El formato concreto se elegiría al diseñar la base.

La rutina de fines de semana alternos usa el mismo modelo: viernes a domingo alternan a partir de una fecha conocida. Los días entre semana y el otro turno pueden quedar sin asignar. Las fechas se guardan como fechas de calendario, sin convertirlas en instantes UTC que puedan desplazar el día.

## Relaciones y comportamiento

Una familia tiene miembros y hogares. Cada hijo o hija tiene su propio calendario; dos hermanos pueden tener rutinas y excepciones diferentes. Un hijo representado sin cuenta sigue teniendo calendario, y se podría vincular una cuenta más adelante sin crear otro hijo ni perder sus fechas.

Cada calendario tiene una rutina activa y sus excepciones. Las asignaciones de rutina y excepciones apuntan a hogares de la misma familia. No se almacenaría un calendario completo para cada año: se calcularía cada día desde la regla, con una alternancia estable entre años.

La excepción siempre tiene prioridad. Si existe una fila con hogar vacío, el día está sin asignar aunque la rutina diga otra cosa. Si se elimina la excepción, vuelve a aplicarse la rutina. Si tampoco hay rutina para ese día, permanece sin asignar. El próximo cambio requiere dos días consecutivos con hogares conocidos y distintos.

El editor puede seguir admitiendo rangos y guardarlos como excepciones por fecha, igual que el prototipo. Cambiar la rutina conserva esas excepciones. El modelo inicial mantiene una regla activa por calendario; un historial de reglas con fechas de vigencia sería una ampliación posterior.

## Conservar los datos del prototipo

No se modifica ahora el almacenamiento local. Las claves `custodia.calendario.v1` y `custodia.calendario.v2`, sus datos y el origen de la vista local se conservan.

Cuando se autorice la conexión, habrá que asignar explícitamente el calendario local a un hijo y relacionar las etiquetas actuales de madre/padre con los hogares correctos. No se debe deducir esa relación a partir de quien inicia sesión. Las fechas manuales anteriores, las excepciones vacías, la fecha de inicio y el anclaje de alternancia deben mantenerse.

La importación deberá poder repetirse sin duplicar datos y verificarse antes de retirar ninguna copia local. Esta propuesta no ejecuta esa importación.

## Permisos pendientes de decidir

Antes de conectar una base real hay que resolver quién puede consultar cada calendario, quién puede modificar su rutina o sus excepciones, qué pueden hacer los hijos y cómo se vinculan o desvinculan las cuentas familiares.

Pertenecer a una familia no debe interpretarse automáticamente como acceso a todos sus calendarios. Si se acuerdan permisos por calendario o por persona, podría añadirse una tabla de accesos, con la persona, el calendario y los permisos aprobados. Se decidirá después de esa conversación; no se fijan aquí permisos por edad, perfil o parentesco.

También quedan pendientes las invitaciones, la asociación de una cuenta a un miembro ya representado y cómo resolver ediciones simultáneas. No se da por aprobada una confirmación familiar de cambios.

## Qué vendría después

Estas seis tablas cubren el calendario que ya funciona. «Hoy y mañana» puede consultar esos mismos datos sin necesitar una tabla propia.

«Mochila» requerirá listas y elementos, con su relación con el hijo o la estancia y sus permisos de privacidad. Los avisos requerirán preferencias individuales y, cuando se implementen notificaciones reales, los datos de dispositivos y entrega que sean necesarios. Ambos avisos mantienen el día anterior por defecto, configuración independiente y ninguna hora predeterminada elegida.

Estas tablas posteriores no forman parte de la conexión inicial. El siguiente paso es decidir quién podrá consultar y modificar el calendario.
