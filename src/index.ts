import express from 'express'
import { userRouter } from './user/user.router'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import path from 'path'
export const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use(userRouter)

export const server = app.listen(port)

export function stopServer() {
  server.close()
}
