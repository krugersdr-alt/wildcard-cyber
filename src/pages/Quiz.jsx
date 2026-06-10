import { useState, useEffect } from 'react'
import { getIPData, getDeviceInfo, generateFakeEmail } from '../lib/utils'
import { supabase } from '../lib/supabase'

const BACKGROUND = 'https://res.cloudinary.com/dpcojkrta/image/upload/v1780334841/Imagen_formulario_evento_seguridad_fgjjag.png'
const VILLAIN_PLACEHOLDER = 'https://res.cloudinary.com/dpcojkrta/image/upload/v1780414176/Joker_iju1qh.png'

const CAPITULOS = [
  {
    id: 1,
    titulo: 'Capítulo 1 — La sesión que no era',
    contexto: 'Son las 3:14 AM. Patricia Vega, CFO, acaba de iniciar sesión desde Bucarest. Las credenciales son correctas, el MFA salió OK. Y bajó el dossier de la adquisición de USD 180M. Hay un problema: Patricia está dormida en Quito.',
    pregunta: '¿Qué haces?',
    opciones: [
      {
        letra: 'A',
        texto: 'Forzar reset de contraseña a Patricia y continuar con el board meeting',
        color: 'border-red-600',
        hover: 'hover:bg-red-900/30',
        consecuencia: 'El atacante todavía tiene el refresh token activo. Mantiene acceso por 47 minutos más. El reset de contraseña no revoca tokens vivos.',
        nivel: 'riesgo-alto',
      },
      {
        letra: 'B',
        texto: 'Aislar la cuenta, revocar sesiones, cancelar el board meeting hasta investigar',
        color: 'border-yellow-500',
        hover: 'hover:bg-yellow-900/30',
        consecuencia: 'El board meeting se cancela. El negocio paga el costo de la decisión binaria. Funcionó, pero a un costo alto.',
        nivel: 'riesgo-medio',
      },
      {
        letra: 'C',
        texto: 'Aislar, revocar tokens, mantener board con dispositivo limpio, investigar en paralelo',
        color: 'border-green-600',
        hover: 'hover:bg-green-900/30',
        consecuencia: 'Contención exitosa con telemetría completa. Resiliencia es contener sin parar el negocio.',
        nivel: 'riesgo-bajo',
      },
    ],
    correcta: 'C',
  },
  {
    id: 2,
    titulo: 'Capítulo 2 — El correo que venía de adentro',
    contexto: 'Felipe Ortiz, Tesorero, recibe un correo de patricia.vega@meridiancg.com pidiendo aprobar una transferencia de USD 2.3M. Es viernes 4:47 PM. SPF, DKIM, DMARC válidos — el correo es técnicamente legítimo.',
    pregunta: '¿Qué hace Felipe?',
    opciones: [
      {
        letra: 'A',
        texto: 'Aprueba la transferencia. Es viernes, es la CFO, el monto está dentro de su autorización',
        color: 'border-red-600',
        hover: 'hover:bg-red-900/30',
        consecuencia: 'Los USD 2.3 millones salen antes del cierre bancario. Irreversibles en 47 minutos. Pero lo peor no es el dinero: mientras el equipo legal persigue la transferencia, Croupier extrae las 340 páginas del contrato M&A. La transferencia fue una distracción deliberada. Pagaron por el privilegio de mirar en la dirección equivocada.',
        nivel: 'riesgo-alto',
      },
      {
        letra: 'B',
        texto: 'Llama directamente a Patricia para confirmar antes de firmar',
        color: 'border-yellow-500',
        hover: 'hover:bg-yellow-900/30',
        consecuencia: 'Patricia responde. La transferencia se detiene. Pero el canal de llamada revela que el buzón estaba comprometido — y Croupier lo sabe. En las siguientes 6 horas, el atacante pivota el vector y destruye evidencia en el inbox. La cadena no se cortó: solo se forzó un paso lateral. El reloj sigue corriendo.',
        nivel: 'riesgo-medio',
      },
      {
        letra: 'C',
        texto: 'Activa el protocolo de dual-approval con verificación out-of-band, independiente del correo',
        color: 'border-green-600',
        hover: 'hover:bg-green-900/30',
        consecuencia: 'Transferencia bloqueada. Buzón aislado en 12 minutos. Defender for Office 365 registra telemetría completa del patrón de actividad del atacante en el inbox. Primera vez que Croupier pierde tiempo. El incidente se escala antes de que el siguiente vector se active.',
        nivel: 'riesgo-bajo',
      },
    ],
    correcta: 'C',
  },
  {
    id: 3,
    titulo: 'Capítulo 3 — El portátil que viajó solo',
    contexto: 'Ricardo Espinoza, Gerente Comercial, está en Lima en un hotel. Usa su iPad personal para acceder a SharePoint. El dispositivo no está inscrito en Intune. En 20 minutos descarga 47MB de la base de clientes corporativos.',
    pregunta: '¿Qué medida aplicas?',
    opciones: [
      {
        letra: 'A',
        texto: 'Bloquear el acceso de Ricardo temporalmente hasta que regrese a la oficina',
        color: 'border-red-600',
        hover: 'hover:bg-red-900/30',
        consecuencia: 'El acceso se corta. Pero los 47 MB se descargaron hace 11 minutos — el bloqueo no revierte la exfiltración. Sin telemetría del dispositivo no administrado, el equipo no sabe qué salió ni si el iPad fue el punto de entrada o el punto de salida. Ricardo pierde acceso en Lima en medio de una negociación activa. El daño ocurrió. Solo se detuvo el sangrado.',
        nivel: 'riesgo-alto',
      },
      {
        letra: 'B',
        texto: 'Permitir el acceso pero registrar la actividad manualmente',
        color: 'border-yellow-500',
        hover: 'hover:bg-yellow-900/30',
        consecuencia: 'El registro manual crea una ilusión de control. Ricardo sigue descargando mientras IT tarda tres horas en revisar los logs. Sin Defender for Cloud Apps no hay forma de determinar si el dispositivo fue comprometido en la red del hotel. El incidente queda abierto. La base de 1.200 clientes ya está fuera del perímetro. El atacante no necesitó forzar nada: el acceso fue concedido voluntariamente.',
        nivel: 'riesgo-medio',
      },
      {
        letra: 'C',
        texto: 'Aplicar políticas MAM, forzar acceso solo desde apps administradas, session control activo',
        color: 'border-green-600',
        hover: 'hover:bg-green-900/30',
        consecuencia: 'Ricardo sigue operativo en Lima. Pero ahora trabaja solo desde apps administradas, con session control activo: sin descarga nativa, solo vista en línea. Defender for Cloud Apps registra cada acción con granularidad forense. La base de clientes permanece dentro del perímetro. Productividad preservada. Croupier no puede exfiltrar lo que nunca tocó el dispositivo.',
        nivel: 'riesgo-bajo',
      },
    ],
    correcta: 'C',
  },
  {
    id: 4,
    titulo: 'Capítulo 4 — El contrato y la inteligencia artificial',
    contexto: 'Carolina Mendoza, Asociada Legal, usa ChatGPT para resumir el contrato de adquisición de USD 180M. En total envía 94.400 tokens a una IA pública sin gobierno corporativo. El contrato completo acaba de salir del perímetro.',
    pregunta: 'Según tu rol, ¿cuál es la prioridad?',
    esFaccion: true,
    opciones: [
      {
        letra: 'A',
        texto: 'Priorizar el análisis de multas regulatorias y exposición financiera por fuga de datos',
        color: 'border-yellow-500',
        hover: 'hover:bg-yellow-900/30',
        consecuencia: 'El análisis de exposición tarda 72 horas. Compliance estima entre USD 800K y USD 2.1M en multas bajo GDPR y normativa SBS Ecuador. Pero mientras se elabora el reporte, Carolina y su equipo continúan usando ChatGPT — nadie les comunicó que había un problema. El contrato ya tiene 94.400 tokens procesados en servidores externos. El riesgo no se detuvo: solo se midió.',
        nivel: 'riesgo-medio',
      },
      {
        letra: 'B',
        texto: 'Activar DLP en endpoint, clasificar el documento como confidencial, bloquear IA externa',
        color: 'border-red-600',
        hover: 'hover:bg-red-900/30',
        consecuencia: 'El bloqueo se implementa. ChatGPT queda inaccesible desde dispositivos corporativos. El equipo legal pierde su herramienta de productividad en la semana más crítica del closing. Los abogados senior empiezan a usar sus teléfonos personales. El shadow IT no desapareció: migró al bolsillo. DLP está activo, pero el comportamiento no cambió — solo cambió el canal.',
        nivel: 'riesgo-alto',
      },
      {
        letra: 'C',
        texto: 'Proveer una alternativa corporativa (M365 Copilot) sin frenar la productividad del equipo legal',
        color: 'border-teal-500',
        hover: 'hover:bg-teal-900/30',
        consecuencia: 'El equipo legal tiene Copilot en 4 horas. Carolina resume el contrato M&A con la misma velocidad — pero los datos permanecen dentro del perímetro con Enterprise Data Protection. Sensitivity Labels clasifican el documento como Confidencial automáticamente. Nadie perdió productividad. Croupier no puede interceptar lo que nunca salió del tenant.',
        nivel: 'riesgo-bajo',
      },
      {
        letra: 'D',
        texto: 'Acelerar la adopción de IA corporativa para mantener ventaja competitiva con datos protegidos',
        color: 'border-yellow-300',
        hover: 'hover:bg-yellow-900/20',
        consecuencia: 'Decisión correcta en dirección — pero la velocidad sin gobierno previo abre una ventana. El rollout de Copilot se aprueba para toda la organización sin clasificar primero la información existente. Durante la implementación, usuarios con permisos excesivos acceden a carpetas M&A que no deberían ver. La IA no era el problema. Los permisos heredados, sí. La casa apuesta bien, pero sin contar las fichas del tablero.',
        nivel: 'riesgo-medio',
      },
    ],
    correcta: null,
  },
  {
    id: 5,
    titulo: 'Capítulo 5 — El silo que faltó cruzar',
    contexto: 'Diego Naranjo, SOC Lead, tiene tres alertas de severidad media en tres consolas distintas: gateway de correo, Defender Endpoint y SIEM on-premise. Ninguna parece crítica por separado.',
    pregunta: '¿Qué decides?',
    opciones: [
      {
        letra: 'A',
        texto: 'Ignorar las alertas — son de severidad media y no están correlacionadas',
        color: 'border-red-600',
        hover: 'hover:bg-red-900/30',
        consecuencia: 'Croupier termina la operación sin interrupción. Diego cierra los tres tickets en las siguientes horas: "falso positivo", "ruido de infraestructura", "actividad atípica no confirmada". Cuando compliance detecta la anomalía en SharePoint tres días después, el contrato M&A ya circuló en un canal financiero privado en Zúrich. Dwell time: 43 días. La casa ganó porque nadie preguntó si las tres cartas eran de la misma mano.',
        nivel: 'riesgo-alto',
      },
      {
        letra: 'B',
        texto: 'Escalar cada alerta por separado a los equipos responsables de cada consola',
        color: 'border-yellow-500',
        hover: 'hover:bg-yellow-900/30',
        consecuencia: 'Tres equipos, tres tickets, tres cronómetros distintos. El equipo de gateway cierra en 4 horas: sin malware. Endpoint responde en 8: contacto C2 bloqueado a nivel de red. El SIEM escala al CISO en 24 horas. Para cuando el tercer ticket llega al nivel correcto, los dos primeros ya están cerrados. Nadie conectó los puntos. La correlación que habría detenido el ataque murió en el proceso de escalada.',
        nivel: 'riesgo-medio',
      },
      {
        letra: 'C',
        texto: 'Correlacionar las tres alertas como un solo incidente y activar respuesta unificada',
        color: 'border-green-600',
        hover: 'hover:bg-green-900/30',
        consecuencia: 'En 90 minutos, Defender XDR unifica las tres alertas en un solo incidente y construye la kill chain completa: identidad → correo → endpoint → datos. Security Copilot genera el resumen y recomienda contención en el orden correcto. Croupier lleva 43 días dentro — pero esta es la primera vez que alguien ve la operación completa. La cadena se corta aquí. Todas las cartas, al fin, en una sola mano.',
        nivel: 'riesgo-bajo',
      },
    ],
    correcta: 'C',
  },
]

function getOrCreateParticipanteId() {
  const key = 'wildcard_participante_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

function calcularScore(respuestas) {
  let correctas = 0
  CAPITULOS.forEach((cap) => {
    if (cap.correcta && respuestas[cap.id] === cap.correcta) correctas++
  })
  return correctas
}

function getMensaje(score) {
  if (score === 0) return { texto: 'No tomaste ninguna decisión correcta. Vector Group completó la operación sin resistencia. Tu empresa fue comprometida desde la semana 1.', color: 'text-red-500' }
  if (score === 1) return { texto: `Tomaste ${score} decisión correcta de 4. Tu empresa habría sido comprometida en la semana 2. Vector Group encontró el camino libre.`, color: 'text-red-400' }
  if (score === 2) return { texto: `Tomaste ${score} decisiones correctas de 4. Tu empresa habría sido comprometida en la semana 3. Detectaste algunas señales pero no las suficientes.`, color: 'text-yellow-500' }
  if (score === 3) return { texto: `Tomaste ${score} decisiones correctas de 4. Tu empresa resistió parcialmente. Vector Group encontró un eslabón débil.`, color: 'text-yellow-400' }
  return { texto: `Tomaste ${score} decisiones correctas de 4. Tu empresa habría contenido el ataque. Pero Vector Group ya tenía el contrato.`, color: 'text-green-400' }
}

function nivelColor(nivel) {
  if (nivel === 'riesgo-alto') return { border: 'border-red-700', badge: 'bg-red-900/50 text-red-400', label: '▲ RIESGO ALTO' }
  if (nivel === 'riesgo-medio') return { border: 'border-yellow-600', badge: 'bg-yellow-900/50 text-yellow-400', label: '◆ RIESGO MEDIO' }
  return { border: 'border-green-700', badge: 'bg-green-900/50 text-green-400', label: '▼ RIESGO CONTENIDO' }
}

export default function Quiz() {
  const [capituloActivo, setCapituloActivo] = useState(null)

  const [registrado, setRegistrado] = useState(
    localStorage.getItem('wc_registrado') === 'true'
  )

  const [form, setForm] = useState(
    JSON.parse(localStorage.getItem('wc_form') || '{"nombre":"","apellido":"","empresa":"","cargo":""}')
  )

  const [respuestas, setRespuestas] = useState(
    JSON.parse(localStorage.getItem('wc_respuestas') || '{}')
  )

  const [respondidos, setRespondidos] = useState(
    JSON.parse(localStorage.getItem('wc_respondidos') || '{}')
  )

  const [glitch, setGlitch] = useState(false)
  const [villainVisible, setVillainVisible] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [datosRobados, setDatosRobados] = useState(null)

  useEffect(() => {
    fetchEstado()
    const sub = supabase
      .channel('quiz_estado')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'evento_estado' }, (payload) => {
        setCapituloActivo(payload.new.capitulo_activo)
      })
      .subscribe()
    return () => supabase.removeChannel(sub)
  }, [])

  useEffect(() => {
    document.title = 'Quiz Wildcard'
  }, [])

  async function fetchEstado() {
    const { data } = await supabase.from('evento_estado').select('*').eq('id', 1).single()
    if (data) setCapituloActivo(data.capitulo_activo)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegistro = () => {
    localStorage.setItem('wc_registrado', 'true')
    localStorage.setItem('wc_form', JSON.stringify(form))
    setRegistrado(true)
  }

  const handleVoto = async (capId, letra) => {
    const nuevasRespuestas = { ...respuestas, [capId]: letra }
    const nuevosRespondidos = { ...respondidos, [capId]: true }

    setRespuestas(nuevasRespuestas)
    setRespondidos(nuevosRespondidos)
    localStorage.setItem('wc_respuestas', JSON.stringify(nuevasRespuestas))
    localStorage.setItem('wc_respondidos', JSON.stringify(nuevosRespondidos))

    const participanteId = getOrCreateParticipanteId()
    await supabase.from('respuestas_capitulo').insert([{
      participante_id: participanteId,
      capitulo: capId,
      respuesta: letra,
    }])
  }

  const handleSubmit = async () => {
    setLoading(true)
    const ipData = await getIPData()
    const deviceInfo = getDeviceInfo()
    const fakeEmail = generateFakeEmail(form.nombre, form.apellido, form.empresa)
    const score = calcularScore(respuestas)

    await supabase.from('participantes').insert([{
      nombre: form.nombre,
      apellido: form.apellido,
      empresa: form.empresa,
      cargo: form.cargo,
      email_ficticio: fakeEmail,
      ip: ipData.ip,
      ciudad: ipData.city,
      pais: ipData.country,
      dispositivo: deviceInfo.device,
      sistema_operativo: deviceInfo.os,
      navegador: deviceInfo.browser,
      score,
      respuestas: JSON.stringify(respuestas),
      created_at: new Date().toISOString()
    }])

    localStorage.removeItem('wc_registrado')
    localStorage.removeItem('wc_form')
    localStorage.removeItem('wc_respuestas')
    localStorage.removeItem('wc_respondidos')
    localStorage.removeItem('wildcard_participante_id')

    setDatosRobados({ fakeEmail, ip: ipData.ip, ciudad: ipData.city, pais: ipData.country, dispositivo: deviceInfo.device, os: deviceInfo.os, score })
    setLoading(false)
    setGlitch(true)

    setTimeout(() => {
      setGlitch(false)
      setVillainVisible(true)
      setTimeout(() => {
        setVillainVisible(false)
        setSubmitted(true)
      }, 3000)
    }, 3000)
  }

  // CARGANDO
  if (capituloActivo === null) {
    return (
      <div className="min-h-screen bg-[#091623] flex items-center justify-center">
        <p className="text-gray-500 font-mono text-sm animate-pulse">Conectando...</p>
      </div>
    )
  }

  // GLITCH
  if (glitch) {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden">
        <div className="absolute inset-0 flex flex-col">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 w-full"
              style={{
                backgroundColor: i % 4 === 0 ? '#1a1a1a' : i % 4 === 1 ? '#0d0d0d' : i % 4 === 2 ? '#111' : '#222',
                transform: `translateX(${Math.sin(i * 137.5) * 20}px)`,
                opacity: 0.7 + (i % 3) * 0.1,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-3">
            <p className="text-red-500 font-mono text-4xl font-bold animate-pulse">⚠ BREACH DETECTED</p>
            <p className="text-gray-400 font-mono text-sm animate-pulse">Exfiltrando datos...</p>
            <p className="text-gray-600 font-mono text-xs">Vector Group · Operación en curso</p>
          </div>
        </div>
      </div>
    )
  }

  // VILLAIN
  if (villainVisible) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
        <div className="text-center space-y-6 px-8">
          {VILLAIN_PLACEHOLDER ? (
            <img src={VILLAIN_PLACEHOLDER} alt="Vector Group" className="w-48 h-48 mx-auto object-cover rounded-full border-2 border-red-800" />
          ) : (
            <div className="w-48 h-48 mx-auto rounded-full border-2 border-red-800 bg-[#0d0d0d] flex items-center justify-center">
              <p className="text-red-600 font-mono text-4xl">👁</p>
            </div>
          )}
          <p className="text-red-500 font-mono text-xl font-bold animate-pulse">VECTOR GROUP</p>
          <p className="text-gray-400 font-mono text-sm max-w-sm mx-auto">
            "La casa no gana porque tiene mejores cartas.<br />Gana porque conoce las probabilidades."
          </p>
        </div>
      </div>
    )
  }

  // PANTALLA FINAL
  if (submitted && datosRobados) {
    const mensaje = getMensaje(datosRobados.score)
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center px-4" style={{ backgroundImage: `url(${BACKGROUND})` }}>
        <div className="w-full max-w-lg bg-black/80 border border-red-800 rounded-lg p-8 font-mono">
          <p className="text-red-500 text-xs mb-1 animate-pulse">▶ VECTOR GROUP — OPERACIÓN COMPLETADA</p>
          <h2 className="text-white text-xl font-bold mb-4">Datos exfiltrados</h2>
          <div className="bg-[#0d0d0d] border border-gray-800 rounded p-4 mb-4 text-sm space-y-1">
            <p className="text-[#C9A84C]">{datosRobados.fakeEmail}</p>
            <p className="text-white">{form.nombre} {form.apellido} — {form.cargo} @ {form.empresa}</p>
            <p className="text-gray-400">{datosRobados.ip} · {datosRobados.ciudad}, {datosRobados.pais}</p>
            <p className="text-gray-400">{datosRobados.dispositivo} · {datosRobados.os}</p>
          </div>
          <p className={`text-sm mb-4 ${mensaje.color}`}>{mensaje.texto}</p>
          <p className="text-gray-600 text-xs">Los datos mostrados fueron utilizados únicamente como parte de esta simulación y no serán almacenados permanentemente ni compartidos fuera de este evento.</p>
        </div>
      </div>
    )
  }

  // REGISTRO CERRADO
  if (!registrado && capituloActivo > 0) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center px-4" style={{ backgroundImage: `url(${BACKGROUND})` }}>
        <div className="w-full max-w-lg bg-black/80 border border-gray-700 rounded-lg p-8 font-mono text-center">
          <p className="text-red-500 text-xs mb-4">▶ REGISTRO CERRADO</p>
          <h2 className="text-white text-xl font-bold mb-2">El evento ya comenzó</h2>
          <p className="text-gray-400 text-sm">El período de registro ha cerrado. No es posible unirse a la simulación en curso.</p>
        </div>
      </div>
    )
  }

  // FORMULARIO DE REGISTRO
  if (!registrado && capituloActivo === 0) {
    return (
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center px-4" style={{ backgroundImage: `url(${BACKGROUND})` }}>
        <div className="w-full max-w-lg bg-black/80 border border-[#C9A84C] rounded-lg p-8 font-mono">
          <p className="text-[#C9A84C] text-xs mb-1">KRUGER × TD SYNNEX × MICROSOFT</p>
          <h1 className="text-white text-3xl font-bold mb-2">THE WILD CARD</h1>
          <p className="text-gray-400 text-sm mb-6">Simulación ejecutiva de ciberseguridad</p>
          <p className="text-gray-300 text-sm mb-6">Ingresa tus datos para participar. Las preguntas comenzarán cuando el conductor inicie el evento.</p>
          <div className="space-y-3 mb-6">
            <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className="w-full bg-[#091623] border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-[#C9A84C]" />
            <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" className="w-full bg-[#091623] border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-[#C9A84C]" />
            <input name="empresa" value={form.empresa} onChange={handleChange} placeholder="Empresa" className="w-full bg-[#091623] border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-[#C9A84C]" />
            <input name="cargo" value={form.cargo} onChange={handleChange} placeholder="Cargo" className="w-full bg-[#091623] border border-gray-600 text-white px-4 py-3 rounded focus:outline-none focus:border-[#C9A84C]" />
          </div>
          <button
            onClick={handleRegistro}
            disabled={!form.nombre || !form.apellido || !form.empresa || !form.cargo}
            className="w-full bg-[#C9A84C] text-black font-bold py-3 rounded hover:bg-yellow-400 transition disabled:opacity-30"
          >
            REGISTRARME
          </button>
        </div>
      </div>
    )
  }

  // PANTALLA PRINCIPAL — registrado
  const capituloData = CAPITULOS.find((c) => c.id === capituloActivo)
  const yaRespondio = capituloActivo > 0 && respondidos[capituloActivo]
  const opcionElegida = yaRespondio && capituloData
    ? capituloData.opciones.find((op) => op.letra === respuestas[capituloActivo])
    : null

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center px-4" style={{ backgroundImage: `url(${BACKGROUND})` }}>
      <div className="w-full max-w-lg bg-black/80 border border-[#C9A84C] rounded-lg p-8 font-mono">

        {capituloActivo === 0 && (
          <div className="text-center">
            <p className="text-[#C9A84C] text-xs mb-4 animate-pulse">▶ REGISTRO COMPLETADO</p>
            <h2 className="text-white text-xl font-bold mb-2">Bienvenido, {form.nombre}</h2>
            <p className="text-gray-400 text-sm">El evento comenzará en breve. Mantén esta pantalla abierta.</p>
          </div>
        )}

        {capituloActivo >= 1 && capituloActivo <= 5 && capituloData && !yaRespondio && (
          <div>
            <p className="text-[#C9A84C] text-xs mb-1">CAPÍTULO {capituloActivo} DE 5</p>
            <h2 className="text-white text-lg font-bold mb-3">{capituloData.titulo}</h2>
            <p className="text-gray-400 text-sm mb-4">{capituloData.contexto}</p>
            <p className="text-[#C9A84C] text-sm font-bold mb-4">{capituloData.pregunta}</p>
            <div className="space-y-3">
              {capituloData.opciones.map((op) => (
                <button
                  key={op.letra}
                  onClick={() => handleVoto(capituloActivo, op.letra)}
                  className={`w-full text-left border ${op.color} ${op.hover} text-white text-sm px-4 py-3 rounded transition`}
                >
                  <span className="font-bold mr-2">{op.letra}.</span>{op.texto}
                </button>
              ))}
            </div>
          </div>
        )}

        {capituloActivo >= 1 && capituloActivo <= 5 && yaRespondio && opcionElegida && (
          <div>
            <p className="text-[#C9A84C] text-xs mb-3">CAPÍTULO {capituloActivo} DE 5 — CONSECUENCIA</p>
            <div className={`border ${nivelColor(opcionElegida.nivel).border} rounded p-4 mb-4`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-white text-sm font-bold">
                  <span className="text-gray-500 mr-1">Elegiste</span> {opcionElegida.letra}. {opcionElegida.texto}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-bold ${nivelColor(opcionElegida.nivel).badge}`}>
                {nivelColor(opcionElegida.nivel).label}
              </span>
              <p className="text-gray-300 text-sm mt-3 leading-relaxed">{opcionElegida.consecuencia}</p>
            </div>
            <p className="text-gray-600 text-xs text-center">Espera el siguiente capítulo.</p>
          </div>
        )}

        {capituloActivo === 6 && (
          <div>
            <p className="text-[#C9A84C] text-xs mb-1 animate-pulse">▶ SIMULACIÓN FINALIZADA</p>
            <h2 className="text-white text-xl font-bold mb-4">Aviso de privacidad</h2>
            <p className="text-gray-400 text-sm mb-6">
              Los datos que ingresaste junto con información de tu dispositivo serán utilizados <span className="text-white">únicamente como parte de esta simulación</span>. No serán almacenados permanentemente ni compartidos fuera de este evento.
            </p>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#B91C1C] text-white font-bold py-3 rounded hover:bg-red-600 transition disabled:opacity-30"
            >
              {loading ? 'PROCESANDO...' : 'ACEPTO Y VER MIS RESULTADOS'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
