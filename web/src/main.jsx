import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? ''

console.log('CLERK KEY:', PUBLISHABLE_KEY);

const clerkAppearance = {
  variables: {
    colorBackground: '#0f172a',
    colorInputBackground: '#1e293b',
    colorText: '#e2e8f0',
    colorTextSecondary: '#94a3b8',
    colorPrimary: '#06b6d4',
    colorNeutral: '#475569',
    colorInputText: '#f1f5f9',
    borderRadius: '0.5rem',
  },
  elements: {
    card: 'shadow-2xl border border-slate-700',
    formButtonPrimary: 'bg-cyan-500 hover:bg-cyan-400 text-white',
    socialButtonsBlockButton: 'border-slate-700 text-slate-200 hover:bg-slate-800',
    formFieldInput: 'bg-slate-800 border-slate-600 text-slate-100',
    footerActionLink: 'text-cyan-400 hover:text-cyan-300',
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={clerkAppearance}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
);
