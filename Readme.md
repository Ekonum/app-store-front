# App Store Frontend

Vue.js frontend for the K3s App Store, providing a UI to browse and manage Helm chart installations.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Getting Started](#getting-started)
    - [Local Development](#local-development)
- [Building for Production](#building-for-production)
- [Docker](#docker)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Contributing](#contributing)

## Prerequisites

- Node.js (version specified in `package.json` engines or >= 18 LTS recommended)
- npm, yarn, or pnpm
- Docker (for building the production image)
- An instance of the `app-store-api` backend running and accessible.

## Project Structure

- `src/`: Main source code for the Vue application.
    - `main.js`: Vue app initialization.
    - `App.vue`: Root Vue component.
    - `components/`: Reusable Vue components.
    - `assets/`: Static assets like images, global styles.
- `public/`: Static assets copied directly to the build output.
- `index.html`: Main HTML entry point.
- `.env`: Environment variables for Vite (used for local dev and build defaults).
- `vite.config.js`: Vite build and development server configuration.
- `Dockerfile`: For building the application Docker image (serves static files with Nginx).
- `nginx.conf`: Nginx configuration for serving the SPA and proxying API requests.
- `k8s/`: Kubernetes manifest files for deployment.

## Configuration

The frontend application uses Vite's environment variable handling.

- **Build-time variables (prefixed with `VITE_`)**:
    - `VITE_K3S_NODE_IP`: The IP address of the K3s node. Used to construct direct URLs to applications exposed via
      NodePort. This is baked in at build time.
    - `VITE_PROD_API_BASE_PATH`: The base path for API calls in production builds (e.g., `/api`). Defaults to `/api`.
    - `VITE_DEV_API_PROXY_TARGET`: The full URL of the backend API for the Vite development server proxy (e.g.,
      `http://192.168.64.8:30080`).

Create a `.env.local` file at the project root to override these for your local development environment. This file
should **not** be committed to Git.
Example `.env.local`:

```env
VITE_K3S_NODE_IP=192.168.64.8
VITE_DEV_API_PROXY_TARGET=http://192.168.64.8:30080
```

The API endpoint used by the application is determined by `import.meta.env.VITE_API_BASE_PATH`.

- In development (`npm run dev`), this will be `/api`, and `vite.config.js` proxies these requests to
  `VITE_DEV_API_PROXY_TARGET`.
- In production builds (`npm run build`), this will also be `/api` (or as defined by `VITE_PROD_API_BASE_PATH`). The
  Nginx server within the Docker container (configured by `nginx.conf`) will proxy these requests to the backend API
  service running in Kubernetes.

## Getting Started

### Local Development

1. **Clone the repository:**

```bash
git clone https://github.com/YOUR_USERNAME/app-store-front.git
cd app-store-front
```

2. **Create `.env.local:`**
   Copy `.env` to `.env.local` and adjust `VITE_K3S_NODE_IP` and `VITE_DEV_API_PROXY_TARGET` to point to your K3s VM IP
   and the API's NodePort.

3. **Install dependencies:**

```bash
npm install # or yarn install / pnpm install
```

4. **Run the development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if `5173` is busy). API calls to `/api`
will be proxied as per `vite.config.js`.

## Building for Production

To build the static assets for production:

```bash
npm run build
```

This will generate a `dist/` directory containing the optimized static files. The `VITE_PROD_API_BASE_PATH` (defaulting
to `/api`) will be used for API calls.

## Docker

The `Dockerfile` builds the Vue application and serves the static files from the `dist/` directory using Nginx. Nginx is
also configured (via `nginx.conf`) to proxy API requests starting with `/api/` to the backend service.

To build the Docker image:

```bash
docker build -t app-store-front:latest .
```

## Kubernetes Deployment

Manifests for deploying the frontend to Kubernetes are in the `k8s/` directory.

1. Build and push the Docker image to a registry (e.g., `ghcr.io/YOUR_USERNAME/app-store-front:tag`).
2. Update `image` in `k8s/00-deployment-front.yaml` if necessary.
3. Apply the manifests:

```bash
# Assuming API is already deployed and its service is app-store-api-service.app-store-api.svc.cluster.local
kubectl apply -f k8s/00-deployment-front.yaml
kubectl apply -f k8s/01-service-front.yaml
```

The frontend will be accessible via the NodePort specified in `k8s/01-service-front.yaml`.

## Contributing

Please follow Conventional Commits specification for commit messages to enable automated versioning and changelog
generation.
