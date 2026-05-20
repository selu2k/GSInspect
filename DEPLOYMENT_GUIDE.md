# GSInspect Deployment Guide

## Overview

This guide covers deploying GSInspect to a Virtual Private Server (VPS) using Docker and automated CI/CD with GitHub Actions. The system uses MariaDB for persistence and Nginx for reverse proxy/SSL.

---

## Prerequisites

### VPS Requirements

**Minimum Specifications:**
- **OS:** Ubuntu 20.04 LTS or newer (recommended: 22.04 LTS)
- **RAM:** 2GB minimum (4GB recommended for production)
- **CPU:** 2 cores
- **Storage:** 20GB
- **Network:** Public IP address, SSH access

### Required Tools (on VPS)

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose-plugin

# Install Git
sudo apt-get install -y git

# Install curl (for health checks)
sudo apt-get install -y curl

# Add your user to docker group (avoid sudo)
sudo usermod -aG docker $USER
```

Verify installation:
```bash
docker --version
git --version
```

---

## Pre-Deployment Setup

### 1. Generate Required Keys

**Generate Django Secret Key:**
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Generate JWT Secret Key:**
```bash
openssl rand -hex 32
```

### 2. SSL Certificate (HTTPS)

**Option A: Using Let's Encrypt (Recommended)**

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates stored at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### 3. DNS Configuration

Point your domain to the VPS public IP:

```dns
yourdomain.com    A    <VPS-IP-ADDRESS>
www.yourdomain.com    CNAME    yourdomain.com
```

Allow DNS to propagate (5-10 minutes).

---

## Automated Deployment with GitHub Actions

### 1. GitHub Secrets Setup

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```
VM_IP_ADDRESS          = <your-vps-ip>
VM_USERNAME            = <ssh-user>
VM_SSH_PRIVATE_KEY     = <your-private-key-content>
ENV_FILE               = <backend-.env-content>
```

**To get your SSH private key:**
```bash
# On VPS - generate key pair
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-deploy

# Display private key content (copy to GitHub secret)
cat ~/.ssh/github-deploy

# Add public key to authorized_keys
cat ~/.ssh/github-deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 2. Create Environment Secret File

Create the content for `ENV_FILE` secret :

```env
DEBUG=False
SECRET_KEY=<your-generated-secret-key>
DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DB_NAME=gsinspect_prod
DB_USER=gsinspect_user
DB_PASSWORD=<strong-secure-password>
DB_HOST=db
DB_PORT=3306
MARIADB_ROOT_PASSWORD=<strong-root-password>
APP_ENV=prod
```

### 3. GitHub Actions Workflow

The deployment workflow is located at `.github/workflows/deploy-vm.yml`:

```yaml
name: Deploy to Azure VM
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Create .env file
        run: |
          mkdir -p backend/web
          echo "${{ secrets.ENV_FILE }}" > backend/web/.env
      
      - name: Copy files to VM
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.VM_IP_ADDRESS }}
          username: ${{ secrets.VM_USERNAME }}
          key: ${{ secrets.VM_SSH_PRIVATE_KEY }}
          source: "."
          target: "~/gsinspect"
      
      - name: Deploy on VM
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VM_IP_ADDRESS }}
          username: ${{ secrets.VM_USERNAME }}
          key: ${{ secrets.VM_SSH_PRIVATE_KEY }}
          script: |
            cd ~/gsinspect
            docker-compose down
            docker-compose up --build -d
            sleep 15
            # Health check
            for i in {1..10}; do
              if curl -f http://localhost/api/health/ > /dev/null 2>&1; then
                echo "App is healthy"
                exit 0
              fi
              sleep 2
            done
            exit 1
```

**Trigger:**
- Workflow runs automatically on `git push` to `main` branch
- Monitor progress in GitHub Actions tab

---

## Manual Deployment Steps

### 1. SSH into VPS

```bash
ssh -i ~/.ssh/github-deploy <username>@<vps-ip>
```

### 2. Clone Repository

```bash
git clone <repository-url>
cd GSInspect
```

### 3. Create Environment Files

```bash
mkdir -p backend/web
nano backend/web/.env
# Paste configuration (see above)

nano frontend/.env
# Paste frontend config

nano .env
# Paste root .env for docker-compose
```

### 4. Pull SSL Certificates

```bash
# If using separate certificate directory
sudo cp -r /etc/letsencrypt/live/yourdomain.com ~/gsinspect/certs/
sudo chown -R $USER:$USER ~/gsinspect/certs/
```

### 5. Start Services

```bash
docker compose up --build -d
```

### 6. Verify Deployment

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs -f web
docker compose logs -f frontend
docker compose logs -f db

# Health check
curl http://localhost:8000/api/health/
curl http://localhost/api/health/
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# API health
curl https://yourdomain.com/api/health/

# Check container status
docker compose ps

# Check resource usage
docker stats

# View logs
docker compose logs --tail=50 web
```

### Database Backups

**Automated Daily Backup:**

```bash
# Create backup script
cat > ~/backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T db mariadb-dump -uroot -p$MARIADB_ROOT_PASSWORD gsinspect_prod | gzip > $BACKUP_DIR/backup_$DATE.sql.gz
# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x ~/backup-database.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-database.sh") | crontab -
```

**Manual Backup:**

```bash
docker compose exec db mariadb-dump -uroot -p$MARIADB_ROOT_PASSWORD gsinspect_prod > backup.sql
```

**Restore from Backup:**

```bash
cat backup.sql | docker compose exec -T db mariadb -uroot -p$MARIADB_ROOT_PASSWORD gsinspect_prod
```

### SSL Certificate Renewal

Let's Encrypt certificates expire after 90 days.

**Automated Renewal:**

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up auto-renewal cron
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

**Reload Nginx after renewal:**

```bash
# Add to /etc/letsencrypt/renewal-hooks/post/
sudo mkdir -p /etc/letsencrypt/renewal-hooks/post/

cat > /etc/letsencrypt/renewal-hooks/post/nginx-reload.sh << 'EOF'
#!/bin/bash
docker compose -f ~/gsinspect/docker-compose.yml exec -T frontend nginx -s reload
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/post/nginx-reload.sh
```

### Log Rotation

```bash
# Set up Docker log rotation
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

sudo systemctl restart docker
```

---

## Scaling & Performance

### Database Optimization

```sql
-- Run inside container
docker compose exec db mariadb -uroot -p$MARIADB_ROOT_PASSWORD gsinspect_prod

-- Add indexes
CREATE INDEX idx_bolt_published ON api_bolt(is_published);
CREATE INDEX idx_test_published ON api_test(is_published);
CREATE INDEX idx_test_bolt ON api_test(bolt_id);
```

### Increase Workers

**Edit `backend/web/entrypoint.sh`:**

```bash
# Change workers based on CPU cores
exec gunicorn web.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4  # Increase from 2
    --timeout 120
```

### Memory Limits

**Edit `docker-compose.yml`:**

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
  
  db:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

---

## Troubleshooting

### Deployment Fails with "Permission Denied"

```bash
# Fix: Ensure SSH key permissions
chmod 600 ~/.ssh/github-deploy
chmod 700 ~/.ssh
```

### Container Keeps Restarting

```bash
# Check logs
docker compose logs web

# Common causes:
# 1. Database not ready - wait longer in health check
# 2. Secret key issues - verify .env file format
# 3. Migration failures - check database connection
```

### High Memory Usage

```bash
# Check what's using memory
docker stats

# Restart services
docker compose down
docker compose up -d

# Increase VPS RAM or optimize queries
```

### SSL Certificate Not Found

```bash
# Verify certificate path
ls -la /etc/letsencrypt/live/yourdomain.com/

# If missing, issue new certificate
sudo certbot certonly --standalone -d yourdomain.com
```

### API Returning 502 Bad Gateway

```bash
# Check if API container is running
docker compose ps web

# Check API logs
docker compose logs web

# Common causes:
# - Web container crashed
# - Database connection failed
# - Port mapping issue
```

---

## Rollback Procedure

### Quick Rollback to Previous Version

```bash
# Stop current deployment
docker compose down

# Checkout previous version
git checkout HEAD~1

# Restart with old version
docker compose up --build -d
```

### Database Rollback

```bash
# From backup
cat backup_YYYYMMDD.sql | docker compose exec -T db mariadb -uroot -p$PASSWORD gsinspect_prod
```

---

## Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Enable firewall (UFW):
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- [ ] Set up SSH key authentication (disable password login)
- [ ] Enable automatic security updates:
  ```bash
  sudo apt-get install -y unattended-upgrades
  sudo systemctl enable unattended-upgrades
  ```
- [ ] Enable audit logging (check logs regularly)
- [ ] Use strong database password (min 16 chars, mixed case)
- [ ] Regularly backup database
- [ ] Monitor disk space
- [ ] Keep SSL certificates updated

---

## Getting Help

- **Docker Logs:** Always check container logs first
- **Health Endpoint:** `/api/health/` should return 200 OK
- **API Docs:** `/api/docs/` for endpoint troubleshooting

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [MariaDB Backup Guide](https://mariadb.com/kb/en/backup-and-restore/)
