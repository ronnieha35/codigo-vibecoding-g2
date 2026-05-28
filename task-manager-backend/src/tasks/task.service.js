import prisma from '../lib/prisma.js'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client'

async function getAllTasks() {
  return prisma.task.findMany()
}

async function getTaskById(id) {
  return prisma.task.findUnique({ where: { id } })
}

async function createTask({ title, description }) {
  return prisma.task.create({
    data: { title, description: description || '' },
  })
}

async function updateTask(id, { title, description, status }) {
  try {
    return await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
    })
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      return null
    }
    throw e
  }
}

async function deleteTask(id) {
  try {
    return await prisma.task.delete({ where: { id } })
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      return null
    }
    throw e
  }
}

export { getAllTasks, getTaskById, createTask, updateTask, deleteTask }
