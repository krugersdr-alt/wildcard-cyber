import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const BACKGROUND = 'https://res.cloudinary.com/dpcojkrta/image/upload/v1780414225/Admin_xud6x9.png'

const CAPITULOS = [
  { id: 0, label: 'EN ESPERA — Registro abierto' },
  { id: 1, label: 'Capítulo 1 — La sesión que no era' },
  { id: 2, label: 'Capítulo 2 — El correo que venía de adentro' },
  { id: 3, label: 'Capítulo 3 — El portátil que viajó solo' },
  { id: 4, label: 'Capítulo 4 — El contrato y la IA' },
  { id: 5, label: 'Capítulo 5 — El silo que faltó cruzar' },
  { id: 6, label: 'FINALIZADO — Mostrar resultados' },
]

export default function Admin() {
  const [capituloActivo, setCapituloActivo] = useState(0)
  const [loading, setLoading] = useState(false)
  const [totalParticipantes, setTotalParticipantes] = useState(0)

  useEffect(() => {
    fetchEstado()
    fetchParticipantes()

    const sub = supabase
      .channel('admin_estado')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'evento_estado' }, (payload) => {
        setCapituloActivo(payload.new.capitulo_activo)
      })
      .subscribe()

    const subP = supabase
      .channel('admin_participantes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'participantes' }, () => {
        setTotalParticipantes((prev) => prev + 1)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(sub)
      supabase.removeChannel(subP)
    }
  }, [])
  useEffect(() => {
  document.title = 'Admin Wildcard'
}, [])

  async function fetchEstado() {
    const { data } = await supabase.from('evento_estado').select('*').eq('id', 1).single()
    if (data) setCapituloActivo(data.capitulo_activo)
  }

  async function fetchParticipantes() {
    const { count } = await supabase.from('participantes').select('*', { count: 'exact', head: true })
    if (count) setTotalParticipantes(count)
  }

  async function activarCapitulo(id) {
    setLoading(true)
    await supabase.from('evento_estado').update({ capitulo_activo: id }).eq('id', 1)
    setCapituloActivo(id)
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${BACKGROUND})` }}
    >
      <div className="min-h-screen bg-black/70 p-8 font-mono">

        <div className="max-w-lg mx-auto">
          <p className="text-[#C9A84C] text-xs mb-1">KRUGER × TD SYNNEX × MICROSOFT</p>
          <h1 className="text-white text-2xl font-bold mb-1">WILDCARD — PANEL ADMIN</h1>
          <p className="text-gray-500 text-xs mb-8">Control del evento · Solo conductor</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-black/60 border border-gray-700 rounded p-4">
              <p className="text-gray-400 text-xs mb-1">PARTICIPANTES</p>
              <p className="text-white text-3xl font-bold">{totalParticipantes}</p>
            </div>
            <div className="bg-black/60 border border-[#C9A84C]/40 rounded p-4">
              <p className="text-gray-400 text-xs mb-1">ESTADO ACTUAL</p>
              <p className="text-[#C9A84C] text-sm font-bold leading-tight">{CAPITULOS[capituloActivo]?.label}</p>
            </div>
          </div>

          <p className="text-gray-500 text-xs mb-3">CONTROLAR EVENTO</p>
          <div className="space-y-2">
            {CAPITULOS.map((cap) => {
              const isActive = cap.id === capituloActivo
              const isPast = cap.id < capituloActivo
              return (
                <button
                  key={cap.id}
                  onClick={() => activarCapitulo(cap.id)}
                  disabled={loading || isActive}
                  className={`w-full text-left px-4 py-3 rounded border text-sm transition
                    ${isActive
                      ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C] cursor-default'
                      : isPast
                      ? 'border-gray-800 bg-black/30 text-gray-600 hover:border-gray-600 hover:text-gray-400'
                      : 'border-gray-700 bg-black/40 text-gray-300 hover:border-[#C9A84C]/50 hover:text-white'
                    } disabled:opacity-60`}
                >
                  <span className="mr-2">
                    {isActive ? '▶' : isPast ? '✓' : '○'}
                  </span>
                  {cap.label}
                </button>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}