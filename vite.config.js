import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'  // ✅ เพิ่มบรรทัดนี้

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],  // ✅ เพิ่ม tailwindcss() ตรงนี้
  base: '/bootcampschedule/',
})