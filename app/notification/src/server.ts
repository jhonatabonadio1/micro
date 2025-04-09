/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'express-async-errors'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { Resend } from 'resend'
import { recoveryPasswordTemplate } from './templates/recovery-password'

import bodyParser from 'body-parser'
import { consumeNotifications } from './config/rabbitConsumer'
import { prismaClient } from './database/prismaClient'

import 'dotenv/config'

const PORT = process.env.PORT || 6002

const app = express()

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://127.0.0.1:3000',
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    optionsSuccessStatus: 200,
    credentials: true,
  }),
)

app.use(bodyParser.raw())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

async function connectChannel() {
  const channelConnection = await consumeNotifications('notification')

  if (channelConnection) {
    channelConnection.consume('notification', (msg) => {
      if (msg !== null) {
        const messageContent = msg.content.toString()
        console.log(`[x] Mensagem recebida: ${messageContent}`)

        const { event, user } = JSON.parse(messageContent)

        switch (event) {
          case 'UserCreated':
            sendMail(user.email, user.id)
            break
        }

        channelConnection.ack(msg)
      }
    })
  }
}

async function sendMail(email: string, userId: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const personalizedTemplate = recoveryPasswordTemplate('#')

  const SUBJECT = 'Conta criada com sucesso - Micro'

  try {
    const createNotificaiton = await prismaClient.notification.create({
      data: {
        email,
        message: SUBJECT,
        userId,
      },
    })

    if (createNotificaiton) {
      await resend.emails.send({
        from: 'Incorporaê <recovery@incorporae.com.br>',
        to: email,
        subject: SUBJECT,
        html: personalizedTemplate,
      })

      return console.log({
        message: 'E-mail de recuperação enviado com sucesso.',
        email,
      })
    }

    console.log('NOTIFICAÇÃO CRIADA', { email, userId })
  } catch (error) {
    console.log('ERRO', error)
  }
}

connectChannel()

app.use(async (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err)
  }

  if (err instanceof Error) {
    return res.status(400).json({ error: err.message })
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
  })
})

app.listen(PORT, () => console.log(`🔥 Servidor iniciado na porta ${PORT}`))
