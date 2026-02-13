import { readFileSync } from 'fs'
import { join } from 'path'

export default async function handler(req: any, res: any) {
  try {
    const file = join(process.cwd(), 'wwwroot', 'index.html')
    const html = readFileSync(file, 'utf8')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(html)
  } catch (e: any) {
    res.status(500).send(e?.message ?? 'Erro ao servir index')
  }
}
