import express from 'express'
import cors from 'cors'
import { crudRouter } from './routes/crud.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api', crudRouter)

const port = process.env.PORT ? Number(process.env.PORT) : 3000

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`)
  })
}

export default app
