export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'OPTIONS') {
      res.status(200).send('')
      return
    }
    if (String(req.method || 'GET').toUpperCase() !== 'GET') {
      res.status(405).json({ error: 'Método não suportado' })
      return
    }

    const publicKey = String(process.env.VAPID_PUBLIC_KEY ?? '').trim()
    if (!publicKey) {
      res.status(500).json({ error: 'VAPID_PUBLIC_KEY ausente no ambiente' })
      return
    }

    res.status(200).json({ publicKey })
  } catch (err: any) {
    res.status(502).json({ error: err?.message ?? 'Erro interno' })
  }
}
