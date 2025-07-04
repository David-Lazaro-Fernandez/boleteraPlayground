elif [[ "$ID" == "amzn" ]]; then
  echo "🚀 Instalando Docker en Amazon Linux 2…"

  # 1) Actualiza la caché de paquetes y los paquetes del sistema
  yum update -y

  # 2) Instala Docker Community Edition desde amazon-linux-extras
  amazon-linux-extras install docker -y

  # 3) Inicia el servicio Docker
  service docker start

  # 4) Habilita Docker para que arranque al bootear
  systemctl enable docker

  # 5) Agrega ec2-user al grupo "docker"
  usermod -aG docker ec2-user
  echo "✅ Agregado ec2-user al grupo docker. Cierra y vuelve a abrir la sesión SSH."
