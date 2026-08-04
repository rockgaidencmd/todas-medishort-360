# Versión publicada

Aplicación maestra **MS360 Enfermería** con sus calculadoras y el simulador de
ventilación mecánica en `ventilador/`.

| Módulo | Versión |
|---|---|
| Simulador Dräger Evita 4 (`ventilador/`) | v5 |

El simulador muestra su número de versión abajo del todo en la pantalla de
inicio, bajo el aviso legal. Si en un dispositivo se ve un número distinto, esa
copia es anterior a la publicada.

## Publicar los cambios

GitHub Pages solo reconstruye el sitio con commits hechos desde la cuenta
propietaria. Si `main` tiene cambios que no se ven en
`rockgaidencmd.github.io/todas-medishort-360/`, hay que forzar la publicación:

1. **Actions → pages build and deployment**: comprobar si la última compilación
   corresponde al último commit de `main`.
2. Si no coincide, hacer cualquier commit desde la cuenta (por ejemplo editar
   este archivo desde la web) o volver a guardar la rama en **Settings → Pages**.

## Reglas de Firestore

Los códigos de activación viven en Firestore, no en el repositorio. Las reglas
que los protegen están versionadas en `firestore.rules` y hay que publicarlas
desde la consola de Firebase. Cierran el listado completo de códigos y solo
permiten consultar y estrenar uno concreto.
