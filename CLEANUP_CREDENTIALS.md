# 🚨 Limpieza de Credenciales Expuestas

## Credenciales Detectadas
GitGuardian detectó las siguientes credenciales expuestas en el repositorio:
- PostgreSQL URI (17 octubre 2025)
- Email Password (17 octubre 2025)
- SMTP credentials (17 octubre 2025)

## ✅ Acciones Realizadas

1. **Limpiado `env.example`**: Todas las credenciales reales han sido reemplazadas por placeholders

## 🔧 Pasos Inmediatos Requeridos

### 1. Cambiar todas las credenciales expuestas

**URGENTE**: Las credenciales que fueron expuestas están comprometidas y deben cambiarse INMEDIATAMENTE:

#### PostgreSQL Database
- Generar una nueva contraseña para la base de datos
- Actualizar la conexión en Neon o tu proveedor de PostgreSQL
- Actualizar `DATABASE_URL` en todas las variables de entorno (Vercel, local, etc.)

#### Gmail / Email
- Revocar la contraseña de aplicación de Gmail: https://myaccount.google.com/apppasswords
- Generar una nueva contraseña de aplicación
- Actualizar `EMAIL_PASS` en todas las variables de entorno

#### NEXTAUTH_SECRET
- Generar nuevo secret: `openssl rand -hex 32`
- Actualizar `NEXTAUTH_SECRET` en todas las variables de entorno
- **IMPORTANTE**: Esto invalidará todas las sesiones activas

#### CRON_SECRET
- Generar nuevo secret: `openssl rand -hex 32`
- Actualizar `CRON_SECRET` en Vercel

#### VAPID Keys
- Regenerar keys: `npm install -g web-push && web-push generate-vapid-keys`
- Actualizar `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` en todas las variables de entorno

### 2. Limpiar el Historial de Git

Las credenciales aún están en el historial de Git. Debes removerlas:

#### Opción A: Usando git filter-branch (nativo)
```bash
# Crear backup primero
git clone --mirror https://github.com/apichafoko/EPIC-Q.git EPIC-Q-backup.git

# Remover credenciales del historial
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch env.example" \
  --prune-empty --tag-name-filter cat -- --all

# Si también hay archivos .env reales en el historial:
# git filter-branch --force --index-filter \
#   "git rm --cached --ignore-unmatch .env .env.local .env.production" \
#   --prune-empty --tag-name-filter cat -- --all

# Forzar push (ADVERTENCIA: Esto reescribe la historia)
git push origin --force --all
git push origin --force --tags
```

#### Opción B: Usando BFG Repo-Cleaner (recomendado)
```bash
# Instalar BFG
brew install bfg  # macOS
# o descargar desde: https://rtyley.github.io/bfg-repo-cleaner/

# Crear backup
git clone --mirror https://github.com/apichafoko/EPIC-Q.git EPIC-Q-backup.git

# Crear archivo con credenciales a remover (credenciales.txt)
echo "npg_6hGjXvMKQs0J" > credenciales.txt
echo "ddrj elee zfqj sgtn" >> credenciales.txt
echo "62a0ae9f5012978412b4ef2f1b3c267e4a7c4ee980e117bc355ff87fd04e69a5" >> credenciales.txt
echo "4c96a2a810e1e2ef8434afb339f5ef692553423880a2ca5a2aa3cfcf1720ea8f" >> credenciales.txt
echo "3YM7EhQsSllGBC64GVYNcogc4xdknmhFiqoMvmBYPUw" >> credenciales.txt

# Limpiar historial
java -jar bfg.jar --replace-text credenciales.txt EPIC-Q-backup.git

# Reconstruir
cd EPIC-Q-backup.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Push forzado
git push --force
```

### 3. Verificar que .gitignore está funcionando

Asegúrate de que `.gitignore` incluye:
```
.env*
*.env
*.env.local
*.env.production
```

### 4. Agregar protección adicional

#### GitHub Secrets Scanning
- Activa GitHub Advanced Security en tu repositorio
- Configura alertas automáticas para nuevas credenciales

#### Pre-commit hooks
Instala `git-secrets` o `truffleHog` para detectar credenciales antes de hacer commit:
```bash
# Instalar git-secrets
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets
sudo make install

# Configurar en el repositorio
cd /path/to/EPIC-Q
git secrets --install
git secrets --register-aws
git secrets --add 'postgresql://.*'
git secrets --add 'EMAIL_PASS=.*'
```

## 📋 Checklist de Seguridad

- [ ] Todas las credenciales expuestas han sido cambiadas
- [ ] Nuevas credenciales actualizadas en Vercel/producción
- [ ] Historial de Git limpiado (o planificado)
- [ ] Todos los colaboradores notificados del cambio
- [ ] `.gitignore` verificado y funcionando
- [ ] Pre-commit hooks instalados (opcional pero recomendado)
- [ ] GitHub Secrets Scanning activado

## ⚠️ Advertencias Importantes

1. **No compartas nunca credenciales reales en el repositorio**
2. **Usa siempre placeholders en archivos de ejemplo**
3. **Verifica que archivos .env* estén en .gitignore antes de hacer commit**
4. **Usa variables de entorno del sistema (Vercel, etc.) para producción**

## 🔗 Recursos

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

