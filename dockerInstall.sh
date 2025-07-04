#!/usr/bin/env bash
set -e

. /etc/os-release

echo "🔍 Detectado OS: $NAME ($ID)"

if [[ "$ID" == "ubuntu" || "$ID" == "debian" ]]; then
  echo "🚀 Instalando Docker en Ubuntu/Debian…"
  apt-get update
  apt-get install -y docker.io
  systemctl start docker
  systemctl enable docker
  usermod -aG docker $USER
  echo "✅ Agregado $USER al grupo docker. Cierra y vuelve a abrir la sesión SSH."
elif [[ "$ID" == "amzn" ]]; then
  echo "🚀 Instalando Docker en Amazon Linux 2…"
  yum update -y
  yum -y install docker
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker ec2-user
  echo "✅ Agregado ec2-user al grupo docker. Cierra y vuelve a abrir la sesión SSH."
  echo "🐳 Docker versión:"
  docker --version
  
else
  echo "❌ Distribución no soportada: $ID"
  exit 1
fi

echo "🐳 Docker versión:"
docker --version

echo "🏗️ Construyendo imagen Docker del proyecto..."
sudo docker build -t boletera-backend .

echo "✅ Imagen Docker construida exitosamente: boletera-backend"
echo "Para ejecutar el contenedor usa: docker run -p 5102:5102 boletera-backend"
