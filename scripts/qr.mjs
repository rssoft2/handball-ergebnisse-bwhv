import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const port = process.env.PORT || 5173

function findLanIPv4() {
  const interfaces = os.networkInterfaces()
  const candidates = []
  for (const name of Object.keys(interfaces)) {
    for (const info of interfaces[name] ?? []) {
      if (info.family === 'IPv4' && !info.internal) {
        candidates.push({ name, address: info.address })
      }
    }
  }
  // Bevorzugt private Heimnetz-Adressen (192.168.x.x / 10.x.x.x)
  const preferred = candidates.find(
    (c) => c.address.startsWith('192.168.') || c.address.startsWith('10.'),
  )
  return (preferred ?? candidates[0])?.address ?? '127.0.0.1'
}

const host = process.env.HOST_IP || findLanIPv4()
const url = `http://${host}:${port}/`
const outFile = path.join(projectRoot, 'app-qr.png')

console.log(`\nApp-Adresse: ${url}\n`)

console.log(await QRCode.toString(url, { type: 'terminal', small: true }))

await QRCode.toFile(outFile, url, { width: 512, margin: 2 })
console.log(`QR-Code gespeichert: ${outFile}\n`)
