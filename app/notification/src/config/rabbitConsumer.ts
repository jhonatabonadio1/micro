// rabbitPublisher.ts
import amqp from 'amqplib'
import 'dotenv/config'

const RABBIT_HOST = process.env.RABBIT_HOST || 'localhost'
const RABBIT_USER = process.env.RABBIT_USER || 'admin'
const RABBIT_PASS = process.env.RABBIT_PASS || 'admin'

export async function consumeNotifications(queueName: string) {
  try {
    // Conecta ao RabbitMQ usando a URL de conexão construída a partir das variáveis de ambiente.
    const connection = await amqp.connect(
      `amqp://${RABBIT_USER}:${RABBIT_PASS}@${RABBIT_HOST}:5672`,
    )
    const channel = await connection.createChannel()

    await channel.assertQueue(queueName, { durable: false })

    console.log(`[*] Aguardando mensagens na fila "${queueName}"`)

    return channel
  } catch (error) {
    console.error('Erro ao consumir mensagens:', error)
  }
}
