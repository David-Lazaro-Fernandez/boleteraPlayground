#!/usr/bin/env bash
# install-docker.sh — instala Docker Engine, Compose y configura tu usuario
set -e

if [[ $EUID -ne 0 ]]; then
  echo "⚠️ Ejecuta con sudo: sudo $0"
  exit 1
fi

. /etc/os-release

echo "🔍 Detectado OS: $NAME ($ID)"

if [[ "$ID" == "ubuntu" || "$ID" == "debian" ]]; then
  echo "🚀 Instalando Docker en Debian/Ubuntu…"
  apt-get update
  apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

  mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/$ID/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/$ID \
    $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

elif [[ "$ID" == "amzn" ]]; then
  echo "🚀 Instalando Docker en Amazon Linux 2…"
  yum update -y

  # Habilita el tópico "docker" y luego instala desde extras
  amazon-linux-extras enable docker
  yum install -y docker

  # Arranca y habilita el servicio
  systemctl enable --now docker

else
  echo "❌ Distribución no soportada por este script: $ID"
  exit 1
fi

# Añade tu usuario al grupo docker para no necesitar sudo
if [[ -n "$SUDO_USER" ]]; then
  usermod -aG docker "$SUDO_USER"
  echo "✅ Agregado $SUDO_USER al grupo docker. Cierra y abre sesión para aplicar."
fi

echo "🐳 Versión de Docker:"
docker --version

echo "🎉 Instalación completada."