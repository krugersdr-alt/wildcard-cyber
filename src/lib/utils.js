export async function getIPData() {
  try {
    const res = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    return {
      ip: data.ip,
      city: 'Quito, La Gloria, Valladolid y Francisco Salazar 24-519',
      country: 'Ecuador',
    }
  } catch {
    return { ip: 'desconocida', city: 'Quito, La Gloria, Valladolid y Francisco Salazar 24-519', country: 'Ecuador' }
  }
}

export function getDeviceInfo() {
  const ua = navigator.userAgent
  let device = 'Desktop'
  let os = 'desconocido'
  let browser = 'desconocido'

  if (/mobile/i.test(ua)) device = 'Mobile'
  else if (/tablet|ipad/i.test(ua)) device = 'Tablet'

  if (/windows/i.test(ua)) os = 'Windows'
  else if (/mac/i.test(ua)) os = 'MacOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/iphone|ipad/i.test(ua)) os = 'iOS'
  else if (/linux/i.test(ua)) os = 'Linux'

  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'Chrome'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari'
  else if (/edge/i.test(ua)) browser = 'Edge'

  return { device, os, browser }
}

export function generateFakeEmail(nombre, apellido, empresa) {
  const n = nombre.toLowerCase().replace(/\s/g, '')
  const a = apellido.toLowerCase().replace(/\s/g, '')
  const e = empresa.toLowerCase().replace(/\s/g, '').replace(/[^a-z0-9]/g, '')
  return `${n}.${a}@${e}.com`
}