'use server'

import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import bcrypt from 'bcrypt'

// Simple in-memory rate limiter per lambda instance
// Structure: Map<IP, { count: number, timestamp: number }>
const rateLimitMap = new Map<string, { count: number, timestamp: number }>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (now - record.timestamp > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
    return true
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false
  }

  record.count += 1
  return true
}

export async function loginAdmin(data: FormData) {
  const username = data.get('username') as string
  const password = data.get('password') as string

  // Note: headers().get('x-forwarded-for') is available in Next.js App Router headers
  const ip = 'anonymous_ip' // Real IP would be retrieved from headers in production if needed
  
  if (!checkRateLimit(ip)) {
    return { error: 'Too many login attempts. Please try again later.' }
  }

  const adminUsername = process.env.ADMIN_USERNAME
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH
  const adminSecret = process.env.ADMIN_SECRET || 'fallback_secret_for_dev'

  console.log("LOGIN ATTEMPT:")
  console.log("Provided user:", username)
  console.log("ENV USER:", adminUsername)
  console.log("ENV HASH:", adminPasswordHash)

  if (!adminUsername || !adminPasswordHash) {
    return { error: 'Admin credentials not configured on the server.' }
  }

  if (username !== adminUsername) {
    return { error: 'Invalid credentials' }
  }

  const isValid = await bcrypt.compare(password, adminPasswordHash)
  console.log("IS VALID:", isValid)
  if (!isValid) {
    return { error: 'Invalid credentials' }
  }

  // Clear rate limit on success
  rateLimitMap.delete(ip)

  // Sign JWT
  const secret = new TextEncoder().encode(adminSecret)
  const jwt = new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
  const jwtToken = await jwt.sign(secret);

  (await cookies()).set('admin_token', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60, // 12 hours
    path: '/',
  })

  return { success: true }
}

export async function logoutAdmin() {
  (await cookies()).delete('admin_token')
  return { success: true }
}
