# La app es un WebView con contenido local: no hay interfaces JavaScript
# expuestas ni reflexión, así que basta con las reglas por defecto.

# Conservar los nombres de línea para que los reportes de fallos de Play
# Console sean legibles.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
