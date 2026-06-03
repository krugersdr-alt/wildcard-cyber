import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const BACKGROUND = 'https://res.cloudinary.com/dpcojkrta/image/upload/v1780321868/Imagen_dashboard_seguridad_xjr0sj.png'

function generateLines(p) {
  const ts = () => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
  }
  return [
    { text: `[${ts()}] IDENTITY_BREACH · ${p.email_ficticio}`, color: 'text-red-400' },
    { text: `[${ts()}] USER_RESOLVED · ${p.nombre} ${p.apellido} · ${p.cargo}`, color: 'text-yellow-400' },
    { text: `[${ts()}] ORG_MAPPED · ${p.empresa}`, color: 'text-yellow-300' },
    { text: `[${ts()}] NETWORK_TRACE · ${p.ip} · ${p.ciudad}, ${p.pais}`, color: 'text-orange-400' },
    { text: `[${ts()}] DEVICE_FINGERPRINT · ${p.dispositivo} · ${p.sistema_operativo} · ${p.navegador}`, color: 'text-purple-400' },
    { text: `[${ts()}] SCORE_EXTRACTED · decisiones_correctas=${p.score ?? 0}/4`, color: 'text-teal-400' },
    { text: `[${ts()}] RECORD_EXFILTRATED · ${p.email_ficticio} ✓`, color: 'text-green-400' },
    { text: `──────────────────────────────────────────`, color: 'text-gray-700' },
  ]
}

export default function Dashboard() {
  const [participantes, setParticipantes] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [lines, setLines] = useState([])
  const [streamDone, setStreamDone] = useState(false)
  const terminalRef = useRef(null)

  useEffect(() => {
    fetchParticipantes()

    const sub = supabase
      .channel('dashboard_participantes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participantes' }, (payload) => {
        setParticipantes((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(sub)
  }, [])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [lines])

  async function fetchParticipantes() {
    const { data } = await supabase
      .from('participantes')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setParticipantes(data)
  }

  async function iniciarStream() {
    if (streaming || participantes.length === 0) return
    setStreaming(true)
    setLines([])
    setStreamDone(false)

    const allLines = participantes.flatMap(generateLines)

    for (let i = 0; i < allLines.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 80 + Math.random() * 120))
      setLines((prev) => [...prev, allLines[i]])
    }

    setStreamDone(true)
    setStreaming(false)
  }

  const scorePromedio = participantes.length > 0
    ? (participantes.reduce((acc, p) => acc + (p.score ?? 0), 0) / participantes.length).toFixed(1)
    : '—'

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${BACKGROUND})` }}
    >
      <div className="min-h-screen bg-black/75 p-6 font-mono flex flex-col gap-6">

        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[#C9A84C] text-xs mb-1">KRUGER × TD SYNNEX × MICROSOFT</p>
            <h1 className="text-white text-2xl font-bold">VECTOR GROUP — PANEL DE EXFILTRACIÓN</h1>
            <p className="text-gray-500 text-xs mt-1">Operación activa · Meridian Capital Group</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs mb-1">REGISTROS CAPTURADOS</p>
            <p className="text-white text-4xl font-bold">{participantes.length}</p>
          </div>
        </div>

        {/* TERMINAL */}
        <div className="bg-black/80 border border-gray-800 rounded flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-600 inline-block" />
              <span className="text-gray-500 text-xs ml-2">vector_group · exfil_stream.sh</span>
            </div>
            <button
              onClick={iniciarStream}
              disabled={streaming || participantes.length === 0}
              className={`px-4 py-1.5 rounded text-xs font-bold transition
                ${streaming
                  ? 'bg-red-900/50 border border-red-700 text-red-400 animate-pulse cursor-not-allowed'
                  : streamDone
                  ? 'bg-green-900/50 border border-green-700 text-green-400 hover:bg-green-900'
                  : 'bg-red-700 border border-red-500 text-white hover:bg-red-600'
                }`}
            >
              {streaming ? '▶ EXFILTRANDO...' : streamDone ? '✓ COMPLETADO — RE-EJECUTAR' : '▶ INICIAR EXFILTRACIÓN'}
            </button>
          </div>

          <div
            ref={terminalRef}
            className="overflow-y-auto p-4 space-y-0.5"
            style={{ height: '55vh' }}
          >
            {lines.length === 0 && !streaming && (
              <p className="text-gray-700 text-xs">
                {participantes.length === 0
                  ? '$ esperando participantes...'
                  : `$ ${participantes.length} registros listos · presiona INICIAR EXFILTRACIÓN`}
              </p>
            )}
            {lines.map((line, i) => (
              <p key={i} className={`text-xs leading-relaxed ${line.color}`}>
                {line.text}
              </p>
            ))}
            {streamDone && (
              <p className="text-green-400 text-xs mt-2 animate-pulse">
                $ exfiltración completada · {participantes.length} registros procesados
              </p>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-black/60 border border-gray-800 rounded p-4">
            <p className="text-gray-500 text-xs mb-1">IDENTIDADES</p>
            <p className="text-red-400 text-2xl font-bold">{participantes.length}</p>
            <p className="text-gray-600 text-xs">emails corporativos exfiltrados</p>
          </div>
          <div className="bg-black/60 border border-gray-800 rounded p-4">
            <p className="text-gray-500 text-xs mb-1">DISPOSITIVOS</p>
            <p className="text-purple-400 text-2xl font-bold">{participantes.length}</p>
            <p className="text-gray-600 text-xs">fingerprints capturados</p>
          </div>
          <div className="bg-black/60 border border-gray-800 rounded p-4">
            <p className="text-gray-500 text-xs mb-1">SCORE PROMEDIO</p>
            <p className="text-yellow-400 text-2xl font-bold">{scorePromedio}</p>
            <p className="text-gray-600 text-xs">decisiones correctas / 4</p>
          </div>
        </div>

      </div>
    </div>
  )
}