// CreateUserService.ts
import { hash } from 'bcryptjs'
import { prismaClient } from '../database/prismaClient'
import { logger } from '../config/logger'
// Importa a função que publica na fila
import { publishToQueue } from '../config/rabbitPublisher'

interface ICreateUserRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

class CreateUserService {
  async execute({ email, password, firstName, lastName }: ICreateUserRequest) {
    logger.info('Iniciando criação de usuário', { email })
    if (!email || !password || !firstName || !lastName) {
      logger.error('Campos obrigatórios não preenchidos.', {
        email,
        password: Boolean(password),
        firstName,
        lastName,
      })
      throw new Error('Preencha os campos obrigatórios.')
    }

    const existingUser = await prismaClient.user.findUnique({
      where: { email },
    })

    // Validação extra de senha
    if (!/(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?=.{8,})/.test(password)) {
      logger.error('Senha inválida.', { email })
      throw new Error(
        'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula e um caractere especial.',
      )
    }

    if (existingUser) {
      logger.error('Usuário já existe.', {
        userId: existingUser.id,
        email: existingUser.email,
      })
      throw new Error('Usuário já existe.')
    }

    const hashedPassword = await hash(password, 12)
    const capitalize = (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

    const createUser = await prismaClient.user.create({
      data: {
        email,
        firstName: capitalize(firstName),
        lastName: capitalize(lastName),
        password: hashedPassword,
      },
    })

    logger.info('Usuário criado com sucesso.', {
      userId: createUser.id,
      email: createUser.email,
    })

    // Prepara a mensagem para notificar o microserviço de notification
    const notificationMessage = {
      event: 'UserCreated',
      user: {
        id: createUser.id,
        email: createUser.email,
        firstName: createUser.firstName,
        lastName: createUser.lastName,
      },
      timestamp: new Date().toISOString(),
    }

    await publishToQueue('notification', notificationMessage)

    return { message: 'Sua conta foi criada, faça o login.' }
  }
}

export { CreateUserService }
