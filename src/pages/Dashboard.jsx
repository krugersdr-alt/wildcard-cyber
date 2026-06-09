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

const CAPITULOS_META = [
  {
    id: 1,
    titulo: 'Cap. 1 — La sesión que no era',
    opciones: [
      { letra: 'A', texto: 'Reset + continuar board' },
      { letra: 'B', texto: 'Aislar + cancelar board' },
      { letra: 'C', texto: 'Aislar + board limpio + investigar' },
    ],
    correcta: 'C',
  },
  {
    id: 2,
    titulo: 'Cap. 2 — El correo que venía de adentro',
    opciones: [
      { letra: 'A', texto: 'Aprobar transferencia' },
      { letra: 'B', texto: 'Llamar a Patricia' },
      { letra: 'C', texto: 'Dual-approval out-of-band' },
    ],
    correcta: 'C',
  },
  {
    id: 3,
    titulo: 'Cap. 3 — El portátil que viajó solo',
    opciones: [
      { letra: 'A', texto: 'Bloquear acceso temporal' },
      { letra: 'B', texto: 'Permitir + registrar manualmente' },
      { letra: 'C', texto: 'Políticas MAM + session control' },
    ],
    correcta: 'C',
  },
  {
    id: 4,
    titulo: 'Cap. 4 — El contrato y la IA',
    opciones: [
      { letra: 'A', texto: 'Análisis de multas regulatorias' },
      { letra: 'B', texto: 'DLP + bloquear IA externa' },
      { letra: 'C', texto: 'Alternativa corporativa (Copilot)' },
      { letra: 'D', texto: 'Acelerar adopción IA corporativa' },
    ],
    correcta: null,
  },
  {
    id: 5,
    titulo: 'Cap. 5 — El silo que faltó cruzar',
    opciones: [
      { letra: 'A', texto: 'Ignorar alertas' },
      { letra: 'B', texto: 'Escalar por separado' },
      { letra: 'C', texto: 'Correlacionar + respuesta unificada' },
    ],
    correcta: 'C',
  },
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

function BarChart({ capMeta, respuestas }) {
  const conteo = {}
  capMeta.opciones.forEach((op) => { conteo[op.letra] = 0 })
  respuestas.forEach((r) => {
    if (conteo[r.respuesta] !== undefined) conteo[r.respuesta]++
  })

  const total = respuestas.length
  const maxVal = Math.max(...Object.values(conteo), 1)

  return (
    <div className="bg-black/70 border border-gray-800 rounded p-4 flex flex-col gap-2 min-w-[200px]">
      <p className="text-[#C9A84C] text-xs font-bold mb-1">{capMeta.titulo}</p>
      <p className="text-gray-500 text-xs mb-2">{total} {total === 1 ? 'respuesta' : 'respuestas'}</p>
      {capMeta.opciones.map((op) => {
        const count = conteo[op.letra] || 0
        const pct = total > 0 ? Math.round((count / total) * 100) : 0
        const barPct = Math.round((count / maxVal) * 100)
        const isCorrect = capMeta.correcta && op.letra === capMeta.correcta
        const barColor = isCorrect ? 'bg-green-500' : 'bg-gray-600'
        const labelColor = isCorrect ? 'text-green-400' : 'text-gray-300'

        return (
          <div key={op.letra}>
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-xs font-mono ${labelColor} flex items-center gap-1`}>
                <span className="font-bold">{op.letra}</span>
                {isCorrect && <span className="text-green-400 text-xs">✓</span>}
              </span>
              <span className="text-xs text-gray-400 font-mono">{count} <span className="text-gray-600">({pct}%)</span></span>
            </div>
            <div className="w-full bg-gray-900 rounded h-2">
              <div
                className={`h-2 rounded transition-all duration-500 ${barColor}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <p className="text-gray-600 text-xs mt-0.5 truncate">{op.texto}</p>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const [participantes, setParticipantes] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [cols, setCols] = useState([[], [], []])
  const [streamDone, setStreamDone] = useState(false)
  const [capituloActivo, setCapituloActivo] = useState(0)
  const [respuestasCapitulo, setRespuestasCapitulo] = useState([])
  const [capitulosVisibles, setCapitulosVisibles] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchParticipantes()
    fetchEstado()
    fetchRespuestasCapitulo()

    const subPart = supabase
      .channel('dashboard_participantes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participantes' }, (payload) => {
        setParticipantes((prev) => [...prev, payload.new])
      })
      .subscribe()

    const subEstado = supabase
      .channel('dashboard_estado')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'evento_estado' }, (payload) => {
        const nuevo = payload.new.capitulo_activo
        setCapituloActivo(nuevo)
        if (nuevo >= 1 && nuevo <= 5) {
          setCapitulosVisibles((prev) => {
            const anterior = nuevo - 1
            if (anterior >= 1 && !prev.includes(anterior)) {
              return [...prev, anterior]
            }
            return prev
          })
        }
        if (nuevo === 6) {
          setCapitulosVisibles([1, 2, 3, 4, 5])
        }
      })
      .subscribe()

    const subResp = supabase
      .channel('dashboard_respuestas')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'respuestas_capitulo' }, (payload) => {
        setRespuestasCapitulo((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(subPart)
      supabase.removeChannel(subEstado)
      supabase.removeChannel(subResp)
    }
  }, [])

  useEffect(() => {
    document.title = 'Dashboard Wildcard'
  }, [])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [cols])

  async function fetchEstado() {
    const { data } = await supabase.from('evento_estado').select('*').eq('id', 1).single()
    if (data) {
      const cap = data.capitulo_activo
      setCapituloActivo(cap)
      if (cap >= 2 && cap <= 5) {
        const visibles = []
        for (let i = 1; i < cap; i++) visibles.push(i)
        setCapitulosVisibles(visibles)
      } else if (cap === 6) {
        setCapitulosVisibles([1, 2, 3, 4, 5])
      }
    }
  }

  async function fetchParticipantes() {
    const { data } = await supabase
      .from('participantes')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setParticipantes(data)
  }

  async function fetchRespuestasCapitulo() {
    const { data } = await supabase
      .from('respuestas_capitulo')
      .select('*')
    if (data) setRespuestasCapitulo(data)
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

        {/* GRAFICOS DE RESPUESTAS */}
        {capitulosVisibles.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs mb-3">INTELIGENCIA DE DECISIONES — ANÁLISIS POR CAPÍTULO</p>
            <div className="grid grid-cols-5 gap-3">
              {capitulosVisibles.map((capId) => {
                const meta = CAPITULOS_META.find((c) => c.id === capId)
                const respCap = respuestasCapitulo.filter((r) => r.capitulo === capId)
                if (!meta) return null
                return (
                  <div key={capId} className="min-w-0">
                    <BarChart capMeta={meta} respuestas={respCap} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

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
