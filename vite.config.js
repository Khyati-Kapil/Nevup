import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const ALLOWED_HOSTS = [
  'localhost',
  '127.0.0.1',
  'nevup.vercel.app',
  'nevup-mssg.onrender.com',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ALLOWED_HOSTS,
  },
  preview: {
    allowedHosts: ALLOWED_HOSTS,
  },
})
