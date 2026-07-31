import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '..'), '')
  const env = { ...rootEnv, ...process.env }
  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    server: {
      port: 3000, // Change this to your preferred port number
      strictPort: true, // Optional: Prevents Vite from automatically trying the next available port if 3000 is occupied
    },
    define: {
      'import.meta.env.BYPASS_EMAIL_VERIFICATION': JSON.stringify(env.BYPASS_EMAIL_VERIFICATION ?? 'false'),
      'import.meta.env.BYPASS_PURDUE_EMAIL_REQUIREMENT': JSON.stringify(env.BYPASS_PURDUE_EMAIL_REQUIREMENT ?? 'false'),
    },
  }
})
