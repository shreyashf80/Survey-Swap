'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function signUp(username: string, name: string, passwordPlain: string, recoveryCodePlain: string) {
  if (username.length < 3 || username.length > 20) return { error: 'Username must be between 3 and 20 characters' }
  if (name.trim().length === 0) return { error: 'Display name is required' }
  if (passwordPlain.length < 6) return { error: 'Password must be at least 6 characters' }
  
  const usernameLower = username.toLowerCase()
  
  const existingUser = await prisma.user.findUnique({ where: { username: usernameLower } })
  if (existingUser) return { error: 'Username already taken' }

  const passwordHash = await bcrypt.hash(passwordPlain, 10)
  const recoveryCodeHash = await bcrypt.hash(recoveryCodePlain, 10)

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: usernameLower,
          name: name.trim(),
          password_hash: passwordHash,
          recovery_code_hash: recoveryCodeHash,
          credit_balance: 1,
        }
      })

      await tx.creditTransaction.create({
        data: {
          user_id: user.id,
          delta: 1,
          reason: 'SIGNUP_BONUS',
        }
      })
    })
    return { success: true }
  } catch (error) {
    console.error('Signup error:', error)
    return { error: 'Failed to create account' }
  }
}

export async function recoverAccount(username: string, recoveryCodePlain: string, newPasswordPlain: string) {
  const usernameLower = username.toLowerCase()
  
  const user = await prisma.user.findUnique({ where: { username: usernameLower } })
  if (!user) return { error: 'Invalid recovery attempt' }

  const isValidCode = await bcrypt.compare(recoveryCodePlain, user.recovery_code_hash)
  if (!isValidCode) return { error: 'Invalid recovery code' }

  const newPasswordHash = await bcrypt.hash(newPasswordPlain, 10)

  await prisma.user.update({
    where: { id: user.id },
    data: { password_hash: newPasswordHash }
  })

  return { success: true }
}

export async function checkUsername(username: string) {
  if (username.length < 3) return { available: false, error: 'Too short' }
  const existingUser = await prisma.user.findUnique({
    where: { username: username.toLowerCase() }
  })
  return { available: !existingUser }
}
