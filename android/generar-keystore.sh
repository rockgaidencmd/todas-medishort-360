#!/usr/bin/env bash
#
# Genera el keystore de release y el key.properties que lo acompaña.
#
#   ./generar-keystore.sh
#
# EJECUTALO EN TU PROPIA MÁQUINA, no en un entorno temporal: el archivo que
# produce es la única forma de volver a firmar actualizaciones de la app.
# Si lo perdés, Google Play no te deja actualizarla nunca más y tenés que
# publicar una app nueva desde cero, perdiendo instalaciones y reseñas.
#
set -euo pipefail

KEYSTORE="ms360-release.jks"
ALIAS="ms360"

if [ -f "$KEYSTORE" ]; then
  echo "Ya existe $KEYSTORE — no lo sobrescribo."
  echo "Si de verdad querés uno nuevo, movelo o borralo a mano primero."
  exit 1
fi

echo "Se va a crear el keystore de release: $KEYSTORE"
echo "Elegí una contraseña larga y guardala en tu gestor de contraseñas."
echo

read -r -s -p "Contraseña del keystore: " PASS; echo
read -r -s -p "Repetir contraseña: "     PASS2; echo
if [ "$PASS" != "$PASS2" ]; then echo "Las contraseñas no coinciden."; exit 1; fi
if [ ${#PASS} -lt 12 ]; then echo "Usá al menos 12 caracteres."; exit 1; fi

keytool -genkeypair -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 4096 \
  -validity 10000 \
  -storepass "$PASS" -keypass "$PASS" \
  -dname "CN=MEDISHORT360, OU=MS360 Enfermeria, O=MEDISHORT360, L=Quito, S=Pichincha, C=EC"

cat > key.properties <<EOF
storeFile=$KEYSTORE
storePassword=$PASS
keyAlias=$ALIAS
keyPassword=$PASS
EOF

chmod 600 "$KEYSTORE" key.properties

echo
echo "Listo:"
echo "  $KEYSTORE      → la clave de firma"
echo "  key.properties → las credenciales que lee Gradle"
echo
echo "Los dos están en .gitignore y NO se suben al repo."
echo "Hacé una copia de seguridad de ambos en un sitio seguro y offline."
echo
echo "Ahora podés compilar:  ./gradlew bundleRelease"
