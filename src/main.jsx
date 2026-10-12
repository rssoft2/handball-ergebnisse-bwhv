import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import KeyGate from './components/KeyGate.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KeyGate>
      <App />
    </KeyGate>
  </StrictMode>,
)
