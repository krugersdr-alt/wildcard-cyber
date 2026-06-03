import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Quiz from './pages/Quiz'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

const DASHBOARD_PASSWORD = 'kruger2026'
const ADMIN_PASSWORD = 'admin2026'

function LoginScreen({ onSuccess, background }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input === onSuccess.password) {
      onSuccess.grant()
      setError(false)
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{ backgroundImage: background ? `url(${background})` : undefined, backgroundColor: !background ? '#091623' : undefined }}
    >
      <div className="w-full max-w-sm bg-black/80 border border-[#C9A84C] rounded-lg p-8 font-mono">
        <p className="text-[#C9A84C] text-xs mb-1">WILDCARD — ACCESO RESTRINGIDO</p>
        <h2 className="text-white text-xl font-bold mb-6">Ingresa la contraseña</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Contraseña"
            className="w-full bg-[#091623] border border-gray-600 text-white px-4 py-3 rounded mb-3 focus:outline-none focus:border-[#C9A84C] font-mono"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mb-3">Contraseña incorrecta.</p>}
          <button
            type="submit"
            className="w-full bg-[#C9A84C] text-black font-bold py-3 rounded hover:bg-yellow-400 transition"
          >
            ACCEDER
          </button>
        </form>
      </div>
    </div>
  )
}

function ProtectedRoute({ password, background, children }) {
  const key = `auth_${password}`
  const [granted, setGranted] = useState(sessionStorage.getItem(key) === 'true')

  if (granted) return children

  return (
    <LoginScreen
      background={background}
      onSuccess={{
        password,
        grant: () => {
          sessionStorage.setItem(key, 'true')
          setGranted(true)
        }
      }}
    />
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/quiz" replace />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/dashboard" element={
          <ProtectedRoute password={DASHBOARD_PASSWORD}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute
            password={ADMIN_PASSWORD}
            background="https://res.cloudinary.com/dpcojkrta/image/upload/v1780414225/Admin_xud6x9.png"
          >
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App