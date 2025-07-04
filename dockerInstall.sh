#!/usr/bin/env bash
set -e

. /etc/os-release

echo "🔍 Detectado OS: $NAME ($ID)"

if [[ "$ID" == "ubuntu" || "$ID" == "debian" ]]; then
  # … tu flujo Debian/Ubuntu aquí …
elif [[ "$ID" == "amzn" ]]; then
  echo "🚀 Instalando Docker en Amazon Linux 2…"
  yum update -y
  amazon-linux-extras install docker -y
  service docker start
  systemctl enable docker
  usermod -aG docker ec2-user
  echo "✅ Agregado ec2-user al grupo docker. Cierra y vuelve a abrir la sesión SSH."
else
  echo "❌ Distribución no soportada: $ID"
  exit 1
fi

echo "🐳 Docker versión:"
docker --version
