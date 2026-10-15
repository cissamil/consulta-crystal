import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // "true" (equivale a 0.0.0.0) faz o Vite escutar em todos os endereços
    // de rede da máquina, não só localhost — assim outros computadores da
    // rede conseguem abrir a tela pelo IP desta máquina.
    host: true,
  },
})
