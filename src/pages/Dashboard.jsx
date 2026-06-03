import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const BACKGROUND = 'https://res.cloudinary.com/dpcojkrta/image/upload/v1780321868/Imagen_dashboard_seguridad_xjr0sj.png'

const COLORS = [
  'text-red-400',
  'text-green-400',
  'text-blue-400',
  'text-yellow-400',
  'text-purple-400',
  'text-teal-400',
  'text-orange-400',
  'text-pink-400',
  'text-cyan-400',
  'text-lime-400',
]

function generateLines(p, colorIdx) {
  const color = COLORS[colorIdx % COLORS.length]
  const ts = () => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
  }
  return [
    { text: `[${ts()}] IDENTITY_BREACH · ${p.email_ficticio}`, color },
    { text: `[${ts()}] USER_RESOLVED · ${p.nombre} ${p.apellido} · ${p.cargo}`, color },
    { text: `[${ts()}] ORG_MAPPED · ${p.empresa}`, color },
    { text: `[${ts()}] NETWORK_TRACE · ${p.ip} · ${p.ciudad}, ${p.pais}`, color },
    { text: `[${ts()}] DEVICE_FINGERPRINT · ${p.dispositivo} · ${p.sistema_operativo} · ${p.navegador}`, color },
    { text: `[${ts()}] SCORE_EXTRACTED · decisiones_correctas=${p.score ?? 0}/4`, color },
    { text: `[${ts()}] RECORD_EXFILTRATED · ${p.email_ficticio} ✓`, color },
    { text: `──────────────────────────────────────────`, color: 'text-gray-700' },
  ]
}

export default function Dashboard() {
  const [participantes, setParticipantes] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [cols, setCols] = useState([[], [], []])
  const [streamDone, setStreamDone] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchParticipantes()
    const sub = supabase
      .channel('dashboard_participantes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participantes' }, (payload) => {
        setParticipantes((prev) => [...prev, payload.new])
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  useEffect(() => {
    document.title = 'Dashboard Wildcard'
  }, [])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [cols])

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
    setCols([[], [], []])
    setStreamDone(false)

    const bloques = participantes.map((p, idx) => ({
      col: idx % 3,
      lines: generateLines(p, idx),
    }))

    for (let bloqueIdx = 0; bloqueIdx < bloques.length; bloqueIdx++) {
      const bloque = bloques[bloqueIdx]
      for (let lineIdx = 0; lineIdx < bloque.lines.length; lineIdx++) {
        await new Promise((resolve) => setTimeout(resolve, 40 + Math.random() * 80))
        const col = bloque.col
        const line = bloque.lines[lineIdx]
        setCols((prev) => {
          const next = [[...prev[0]], [...prev[1]], [...prev[2]]]
          next[col] = [...next[col], line]
          return next
        })
      }
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

        {/* TERMINAL 3 COLUMNAS */}
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

          <div className="p-4" style={{ minHeight: '75vh' }}>
            {cols[0].length === 0 && cols[1].length === 0 && cols[2].length === 0 && !streaming && (
              <p className="text-gray-700 text-xs">
                {participantes.length === 0
                  ? '$ esperando participantes...'
                  : `$ ${participantes.length} registros listos · presiona INICIAR EXFILTRACIÓN`}
              </p>
            )}
            <div className="grid grid-cols-3 gap-6">
              {cols.map((colLines, colIdx) => (
                <div key={colIdx} className="space-y-0.5">
                  {colLines.map((line, i) => (
                    <p key={i} className={`text-xs leading-relaxed break-all ${line.color}`}>
                      {line.text}
                    </p>
                  ))}
                </div>
              ))}
            </div>
            {streamDone && (
              <p className="text-green-400 text-xs mt-4 animate-pulse">
                $ exfiltración completada · {participantes.length} registros procesados
              </p>
            )}
            <div ref={bottomRef} />
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