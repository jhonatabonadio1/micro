// rabbitPublisher.ts
import amqp from 'amqplib'
import 'dotenv/config'

const RABBIT_HOST = process.env.RABBIT_HOST || 'localhost'
const RABBIT_USER = process.env.RABBIT_USER || 'admin'
const RABBIT_PASS = process.env.RABBIT_PASS || 'admin'

export async function publishToQueue(queueName: string, message: any) {
  const connString = `amqp://${RABBIT_USER}:${RABBIT_PASS}@${RABBIT_HOST}:5672`
  const connection = await amqp.connect(connString)
  const channel = await connection.createChannel()

  // Garante que a fila existe; aqui, usamos durable: false para simplicidade
  await channel.assertQueue(queueName, { durable: false })

  // Envia a mensagem convertida para Buffer (string JSON)
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)))
  console.log(`Mensagem enviada para a fila "${queueName}"`)

  // Fecha o canal e a conexão após um breve atraso
  setTimeout(() => {
    channel.close()
    connection.close()
  }, 500)
}
