# 🚀 Production Deployment Guide - Olympics Vault

This project is fully containerized using **Docker** and **Docker Compose**, with an **Nginx** reverse proxy serving the static React build and proxying API endpoints. This setup eliminates CORS issues, isolates the database, and is ready to deploy to any cloud server (DigitalOcean, AWS EC2, Linode, GCP, or Azure).

---

## 🛠️ Prerequisites

Ensure the following are installed on your target production server:
1. **Docker**: [Install Docker](https://docs.docker.com/engine/install/)
2. **Docker Compose**: [Install Docker Compose](https://docs.docker.com/compose/install/)

---

## 📦 Deploying in 1 Command

1. Clone or copy this repository to your production server.
2. Navigate to the root directory containing `docker-compose.yml`.
3. Start the entire container stack in daemon (background) mode:
   ```bash
   docker compose up -d --build
   ```

### What this does automatically:
- **`backend` service**: Builds the FastAPI server, exposes port `8001` internally, and seeds the SQLite database (`olympics.db`) from CSV assets if it is empty.
- **`frontend` service**: Compiles the optimized React-Vite static bundle using Node, configures Nginx, copy-pastes `nginx.conf`, and listens on public port `80`.
- **Data Persistence**: Mounts a Docker volume `sqlite_data` to `/app/db` in the backend container, ensuring the SQLite database is persisted safely across container upgrades or restarts.

---

## 🌐 Nginx Reverse Proxy Setup (Port 80)

To avoid CORS restrictions, all communication goes through the frontend container on port `80`:
- Any standard web request (`/`) is served the static React UI.
- Any request starting with `/api` is routed directly to the Python container via Nginx's internal network (`http://backend:8001`).

---

## 🔒 Securing with HTTPS (Certbot SSL)

To add free SSL certificates (HTTPS) in production:

1. Connect your domain name (e.g. `olympics.yourdomain.com`) to your server's public IP address.
2. Install Certbot on the host machine:
   ```bash
   sudo apt update
   sudo apt install certbot
   ```
3. Request the certificate:
   ```bash
   sudo certbot certonly --standalone -d olympics.yourdomain.com
   ```
4. Update `docker-compose.yml` to mount the certificate folder, or configure an Nginx proxy on the host machine to terminate SSL and route to local port `80`.

---

## ☁️ Deploying to Railway / Render (Serverless / SaaS)

Since platforms like **Railway** and **Render** build containers independently and don't natively support host Nginx mapping via Docker Compose in their free tiers, you should deploy the frontend and backend as **two separate web services**:

### 1. Backend Web Service Setup
1. Create a new Web Service on Railway or Render.
2. Select your repository.
3. Configure the following parameters:
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Port**: `8001`
4. Copy the public URL provided by the platform (e.g., `https://olympics-backend.up.railway.app` or `https://olympics-backend.onrender.com`).

### 2. Frontend Static / Web Service Setup
1. Create a new Static Site (or Web Service) on Railway or Render.
2. Select your repository.
3. Configure the following parameters:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory / Output Folder**: `dist`
4. Add an **Environment Variable**:
   - Key: `VITE_API_BASE`
   - Value: `<YOUR_BACKEND_PUBLIC_URL>` (Paste the URL copied from the backend service step)

This separates static file rendering from python computing, guaranteeing 100% build success on serverless cloud platforms.

