# Asistencia Petra Ríos

Plataforma de toma de lista, salidas de alumnos y alertas de faltas para la Escuela Secundaria Oficial "Petra Ríos" (Romita, Gto.). Prototipo.

## Arquitectura

- **Front (esta carpeta raíz):** app web instalable (PWA) en HTML, CSS y JavaScript sin dependencias. Se publica con GitHub Pages.
- **Back (`backend/`):** Google Apps Script ligado a una hoja de Google Sheets que funciona como base de datos. Se publica como aplicación web y recibe `POST {accion, args, token}`.
- **Inicio de sesión:** Google Identity Services. El back verifica el token de Google y el rol del usuario en la pestaña `Usuarios`.

## Funciones

- Lista diaria por grupo desde el celular, también sin internet.
- Retardos con hora y llamada pendiente a los padres.
- Salidas con firma en pantalla y aprobación de dirección si quien recoge no está autorizado.
- Justificaciones (trabajo social) que recalculan las alertas.
- Alertas por ventana móvil de 10 días hábiles: en riesgo (3 a 5 faltas) y roja (más de 5).
- Altas, bajas, cambios de grupo y cambio de ciclo con historial.
- Concentrado quincenal imprimible y descargable en CSV.

## Configuración

- `config.js`: URL de la implementación de Apps Script (`/exec`).
- Hoja, pestaña `Config`: horarios, umbrales y `GOOGLE_CLIENT_ID`.
- Al publicar cambios del front, sube `VERSION` en `sw.js` para que los celulares descarguen la versión nueva.

Los datos de alumnos viven solo en la hoja de Google; este repositorio no contiene datos personales.
