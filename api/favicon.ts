export default async function handler(req: any, res: any) {
  const urlObj = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`)
  const type = urlObj.searchParams.get('type') || 'png'
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
  const buf = Buffer.from(pngBase64, 'base64')
  if (type === 'ico') {
    res.setHeader('Content-Type', 'image/x-icon')
  } else {
    res.setHeader('Content-Type', 'image/png')
  }
  res.status(200).send(buf)
}
