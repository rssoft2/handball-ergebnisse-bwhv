import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import KeyGate from './components/KeyGate.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <KeyGate>
        <App />
      </KeyGate>
    </ErrorBoundary>
  </StrictMode>,
)
