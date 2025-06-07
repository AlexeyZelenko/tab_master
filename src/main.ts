import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

function initializeApp() {
  console.log('Initializing app...')
  const app = createApp(App)
  app.mount('#app')
  console.log('Vue app mounted successfully')
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  initializeApp()
}