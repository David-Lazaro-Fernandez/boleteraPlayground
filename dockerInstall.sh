#!/usr/bin/env bash
# install-docker.sh — instala Docker Engine, Compose y configura tu usuario
set -e

# Comprueba privilegios
if [[ $EUID -ne 0 ]]; then
  echo "⚠️  Ejecuta como root o con sudo: sudo ./install-docker.sh"
  exit 1
fi

# Detectar distro
. /etc/os-release

echo "🔍 Detected OS: $NAME ($ID)"

if [[ "$ID" == "ubuntu" || "$ID" == "debian" ]]; then
  echo "🚀 Instalando Docker en Debian/Ubuntu..."

  apt-get update

  # Instalar prerequisitos
  apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

  # Añadir repositorio oficial de Docker
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/$ID/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/$ID \
    $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list

  # Instalar Docker y Compose
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

elif [[ "$ID" == "amzn" || "$ID_LIKE" == *"rhel"* ]]; then
  echo "🚀 Instalando Docker en Amazon Linux 2 / RHEL..."

  yum update -y

  yum install -y \
    yum-utils \
    device-mapper-persistent-data \
    lvm2

  # Añadir repositorio de Docker
  yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

  # Instalar Docker
  yum install -y docker-ce docker-ce-cli containerd.io

  # (Opcional) instalar Docker Compose v2 como plugin
  yum install -y docker-compose-plugin

else
  echo "❌ Distribución no soportada por este script: $ID"
  exit 1
fi

# Iniciar y habilitar Docker
systemctl enable docker
systemctl start docker

# Añadir tu usuario actual al grupo docker
if [[ -n "$SUDO_USER" ]]; then
  usermod -aG docker "$SUDO_USER"
  echo "✅ Agregado $SUDO_USER al grupo 'docker'. Cierra sesión y vuelve a entrar para aplicar."
else
  echo "⚠️ No detecté SUDO_USER, revisa manualmente la pertenencia al grupo 'docker'."
fi

# Verificar instalación
echo "🐳 Docker version:"
docker --version

echo "🧩 Docker Compose plugin version:"
docker compose version

echo "🎉 Instalación completada."
