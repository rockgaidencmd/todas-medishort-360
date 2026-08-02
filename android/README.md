# MS360 Enfermería — app Android

Contenedor Android de la PWA que vive en la raíz de este repositorio.

## Cómo funciona

La app es un `WebView` que carga el contenido web **empaquetado dentro del
APK**. En cada build, Gradle copia los archivos de la raíz del repo a
`app/src/main/assets/`, así que la web y la app comparten una única fuente de
verdad: se edita el HTML de la raíz y la app lo recoge sola.

El contenido se sirve con
[`WebViewAssetLoader`](https://developer.android.com/reference/androidx/webkit/WebViewAssetLoader),
que lo entrega bajo un origen `https://` interceptado dentro del proceso. Eso
da un contexto seguro real (necesario para `localStorage` y para que los
iframes de las calculadoras funcionen) **sin tocar la red**: la app no declara
el permiso `INTERNET` y no puede conectarse a ningún sitio.

## Valores de publicación

| Campo | Valor |
|---|---|
| `applicationId` | `com.medishort360.enfermeria` |
| `versionCode` | `1` |
| `versionName` | `1.0.0` |
| `minSdk` | 24 (Android 7.0) |
| `targetSdk` / `compileSdk` | 36 (Android 16) |
| Permisos | ninguno |

`targetSdk 36` es lo que Google Play exige para apps nuevas desde el
31 de agosto de 2026.

> **`applicationId` no se puede cambiar después de publicar.** Si querés otro,
> cambialo ahora, antes de la primera subida.

En cada actualización hay que **subir `versionCode`** (2, 3, 4…). Play rechaza
un bundle con un `versionCode` que ya existe.

## Requisitos

- JDK 17 o superior
- Android SDK con la plataforma API 36
  (Android Studio lo instala solo, o `sdkmanager "platforms;android-36"`)

Si compilás por línea de comandos, indicá dónde está el SDK creando
`android/local.properties`:

```properties
sdk.dir=/ruta/a/tu/Android/Sdk
```

## 1. Crear la clave de firma (una sola vez)

```bash
cd android
./generar-keystore.sh
```

Genera `ms360-release.jks` y `key.properties`. Los dos están en `.gitignore`.

> ⚠️ **Guardá una copia de seguridad del `.jks` y de su contraseña.**
> Es la única forma de firmar futuras actualizaciones. Si lo perdés, Google
> Play no te permite actualizar la app nunca más: hay que publicar una app
> nueva desde cero y se pierden instalaciones y reseñas.

## 2. Compilar el App Bundle

```bash
cd android
./gradlew bundleRelease
```

El archivo queda en:

```
android/app/build/outputs/bundle/release/app-release.aab
```

Ese `.aab` es lo que se sube a Play Console.

## Probar antes de subir

```bash
./gradlew installRelease     # instala en un dispositivo conectado por USB
```

Conviene revisar a mano: que arranque directo en el menú, que el disclaimer
salga solo la primera vez, que las cuatro calculadoras abran, y que el botón
físico de atrás cierre la calculadora en vez de salir de la app.
