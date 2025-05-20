import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
    // Load env file based on current mode (development, production)
    const env = loadEnv(mode, process.cwd(), '');

    const devApiProxyTarget = env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:8080'; // Default if not set

    return {
        plugins: [vue()],
        server: {
            port: 5173, // Default Vite port
            proxy: {
                // Proxy /api requests to the backend API during development
                // This matches the VITE_PROD_API_BASE_PATH for consistency
                '/api': {
                    target: devApiProxyTarget, // Target URL of your Go API (from .env)
                    changeOrigin: true,
                    // No rewrite needed if VITE_DEV_API_PROXY_TARGET already includes /api
                    // If VITE_DEV_API_PROXY_TARGET is just http://host:port, then rewrite:
                    // rewrite: (path) => path.replace(/^\/api/, '/api'), // Or just '' if target includes /api
                }
            }
        },
        // Define global constants for the build (used in client-side code)
        define: {
            // Based on the mode, use the appropriate API base path
            // In prod, it will be '/api'. In dev, it's also '/api' but proxied by Vite dev server.
            'import.meta.env.VITE_API_BASE_PATH': JSON.stringify(
                mode === 'production' ? env.VITE_PROD_API_BASE_PATH || '/api' : '/api'
            )
        }
    }
})
