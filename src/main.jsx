import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useAuthStore } from './store/authStore'
import App from './App.jsx'
import './index.css'

useAuthStore.getState().restoreSession().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})