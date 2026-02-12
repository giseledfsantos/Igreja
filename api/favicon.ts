export default async function handler(req: any, res: any) {
  const type = (req.query.type as string) || 'png'
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
  const buf = Buffer.from(pngBase64, 'base64')
  if (type === 'ico') {
    res.setHeader('Content-Type', 'image/x-icon')
  } else {
    res.setHeader('Content-Type', 'image/png')
  }
  res.status(200).send(buf)
}
