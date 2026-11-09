# Casa a Casa · cuentas, familia y propuestas

Actualizado el 9 de noviembre de 2026. Proyecto en C:\Users\pc\Desktop\Bruno\Casa a Casa.

La aplicación y la migración están preparadas. El usuario eligió el proyecto xsaxwhqwjvzafrlfvchn y la cuenta AdBruno. Las herramientas de este chat aún solo exponen bruno y Jan. La consulta de sus proyectos y organizaciones confirma que ninguna corresponde a AdBruno ni contiene el proyecto elegido. No se ha aplicado la migración remota. Las reglas se han probado con PostgreSQL local mediante PGlite y usuarios de prueba. La autenticación y la sincronización entre teléfonos requieren la conexión real.

## Modelo implementado

La cuenta de acceso pertenece a Supabase Auth. La tabla de miembros relaciona esa cuenta con una familia y fija un permiso parental o de hijo. El perfil madre, padre, hijo o hija adapta los textos. Cambiar el perfil del modo individual no cambia un permiso familiar.

| Tabla | Contenido |
| --- | --- |
| casa_families | Familia y cuenta que la crea. |
| casa_members | Nombre familiar, perfil, permiso y cuenta opcional. |
| casa_calendars | Un calendario por miembro hijo, con rutina, excepciones y número de revisión. |
| casa_proposals | Fechas y destino propuestos, explicación, revisión de origen, estado y resolución. |
| casa_private.invitations | Huella del código, miembro al que vincula, caducidad, revocación y cuenta que lo usó. |

Se conservan las etiquetas de hogar madre y padre del calendario existente. La rutina y las excepciones mantienen sus formatos y fechas civiles. El servidor limita el calendario a 1 MB de JSON. Una excepción vacía deja el día sin asignar y retirar la excepción recupera la rutina.

## Reglas de acceso

Los progenitores consultan y gestionan los calendarios de los hijos de su familia. Cualquiera de los progenitores autorizados puede aceptar o rechazar una propuesta. Los hijos consultan únicamente su propio calendario y proponen cambios de fechas y destino. Pueden añadir una explicación.

Se crean hijos representados sin cuenta con su calendario. Un progenitor genera después una invitación para vincular una cuenta al miembro existente. Así se conserva el calendario. Una cuenta puede pertenecer a varias familias con permisos distintos.

Las tablas expuestas usan RLS y solo conceden lectura a cuentas autenticadas según su pertenencia y calendario. Las escrituras pasan por una lista cerrada de operaciones. Las funciones con privilegios están en un esquema privado, fijan un search_path vacío y comprueban la sesión y la pertenencia. El cliente solo utiliza una clave publicable.

Los códigos se generan en el servidor, caducan en 48 horas y vinculan una cuenta al miembro y permiso fijados por el progenitor. Se comparte el código manualmente. Generar uno nuevo invalida el anterior. Cambiar un argumento del cliente no cambia el permiso. La huella se guarda con SHA-256 y el código completo solo se devuelve al generarlo.

## Cambios y conflictos

Crear una propuesta conserva el calendario confirmado. Aceptar bloquea el calendario y la propuesta dentro de una transacción, verifica el permiso parental y la revisión de origen, aplica el rango y registra quién resolvió. Repetir la misma aceptación devuelve la resolución existente. Rechazar conserva las fechas.

Si otro cambio ha aumentado la revisión, la aceptación falla. Se muestra el conflicto y se puede rechazar y pedir una propuesta nueva. El guardado parental y la importación también exigen la revisión que se estaba editando.

La consulta se renueva al entrar, al volver a la app y cada 15 segundos con conexión. Los datos familiares no se guardan como copia local del calendario. Un fallo de consulta retira el contenido familiar visible. El cambio de familia y el cierre de sesión retiran la selección anterior.

## Datos individuales y privados

Las claves individuales del calendario, las mochilas y los recordatorios se conservan. Importar un calendario exige elegir el hijo, revisar cuántas excepciones y rutinas se copiarán y confirmar la sustitución del calendario familiar. Se conserva el original individual.

Las mochilas y preferencias de avisos familiares permanecen en el dispositivo, separadas por cuenta y calendario. La planificación de avisos usa el calendario confirmado seleccionado. Al cambiar de calendario se revisa la cola de avisos. Estos datos privados no se envían a la familia.

## Habilitar el servidor

El servidor elegido es https://xsaxwhqwjvzafrlfvchn.supabase.co. La conexión de AdBruno debe aparecer en las herramientas del chat con acceso al proyecto para aplicar y comprobar el modelo. Una vez habilitado, se debe aplicar supabase/migrations/20261109193242_family_access.sql, comprobar RLS y asesores de seguridad, y configurar los dos valores públicos de configuracion.example en un archivo .env.local.

Configura el acceso por correo y contraseña con confirmación de correo y la dirección de revisión permitida. El registro se inicia solo mediante el botón de la app. Las invitaciones familiares se comparten con su código. Después recompila web y móvil y verifica con cuentas de prueba autorizadas la sesión, el aislamiento y la consulta desde dos dispositivos.

Las pruebas PGlite verifican las funciones y RLS de PostgreSQL con auth.uid() de prueba. Las pruebas de interfaz interceptan la API con datos ficticios. Queda pendiente la integración real con Supabase Auth, PostgREST y teléfonos físicos.

Fuentes consultadas el 9 de noviembre. [Supabase Auth con React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
