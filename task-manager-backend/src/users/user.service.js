import prisma from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'
import { randomUUID } from 'crypto'

const SALT_ROUNDS = 10

async function registerUser({ name, lastname, email, password }) {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

  try {
    const user = await prisma.user.create({
      data: { name, lastname, email, password: hashedPassword },
    })
    const { password: _pw, token: _tk, ...userWithoutSensitiveData } = user
    return userWithoutSensitiveData
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
      const conflict = new Error('Email already in use')
      conflict.status = 409
      throw conflict
    }
    throw e
  }
}

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    const err = new Error('Invalid credentials')
    err.status = 401
    throw err
  }

  const passwordMatches = await bcrypt.compare(password, user.password)
  if (!passwordMatches) {
    const err = new Error('Invalid credentials')
    err.status = 401
    throw err
  }

  const token = randomUUID()
  await prisma.user.update({ where: { id: user.id }, data: { token } })

  return { token }
}

export { registerUser, loginUser }
