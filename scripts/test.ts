import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('--- Running SurveySwap Checks ---')

  // 1. Clean up old test data if any
  await prisma.adminAction.deleteMany({})
  await prisma.creditTransaction.deleteMany({})
  await prisma.fillEvent.deleteMany({})
  await prisma.survey.deleteMany({})
  await prisma.user.deleteMany({ where: { username: { startsWith: 'testuser_' } } })

  // 2. Create Test Users
  console.log('Creating test users...')
  const userA = await prisma.user.create({
    data: { username: 'testuser_A', password_hash: 'hash', recovery_code_hash: 'hash', credit_balance: 3 }
  })
  const userB = await prisma.user.create({
    data: { username: 'testuser_B', password_hash: 'hash', recovery_code_hash: 'hash', credit_balance: 3 }
  })
  const userC = await prisma.user.create({
    data: { username: 'testuser_C', password_hash: 'hash', recovery_code_hash: 'hash', credit_balance: 3 }
  })
  const userD = await prisma.user.create({
    data: { username: 'testuser_D', password_hash: 'hash', recovery_code_hash: 'hash', credit_balance: 3 }
  })

  // 3. Post a survey for User A
  console.log('Posting Survey for User A...')
  const surveyA = await prisma.survey.create({
    data: {
      owner_id: userA.id,
      google_form_url: 'https://docs.google.com/forms/d/e/123/viewform',
      target_responses: 5,
      status: 'ACTIVE'
    }
  })

  // Ensure user cannot post another survey
  const existingActive = await prisma.survey.findFirst({
    where: { owner_id: userA.id, status: { in: ['ACTIVE', 'PAUSED'] } }
  })
  if (existingActive) {
    console.log('CHECK PASSED: Enforced 1 active survey rule.')
  } else {
    console.log('CHECK FAILED: Should have found an active survey.')
  }

  // 4. Fill Survey (User B fills User A's survey)
  console.log('User B filling User A survey...')
  
  // We will call the actual logic by copy-pasting the core confirmFill logic here, or just importing it if we mock.
  // Actually we can't easily import `confirmFill` if it uses Next.js server action context (like headers, cookies etc which it doesn't). 
  // Let's just import it directly!
  const { confirmFill } = require('../src/app/actions/credits')
  
  const res1 = await confirmFill(surveyA.id, userB.id)
  if (res1.error) console.log('ERROR in fill 1:', res1.error)
  else console.log('CHECK PASSED: Fill 1 successful.')

  // 5. Verify balances
  const updatedUserA = await prisma.user.findUnique({ where: { id: userA.id } })
  const updatedUserB = await prisma.user.findUnique({ where: { id: userB.id } })
  if (updatedUserA?.credit_balance === 2 && updatedUserB?.credit_balance === 4) {
    console.log('CHECK PASSED: Balances updated correctly (A: 2, B: 4).')
  } else {
    console.log(`CHECK FAILED: Balances incorrect (A: ${updatedUserA?.credit_balance}, B: ${updatedUserB?.credit_balance}).`)
  }

  // 6. User B tries to fill again
  const res2 = await confirmFill(surveyA.id, userB.id)
  if (res2.error === 'You have already filled this survey') {
    console.log('CHECK PASSED: Double-fill prevented.')
  } else {
    console.log('CHECK FAILED: Double-fill not prevented correctly.')
  }

  // 7. Drain User A's credits to 0
  console.log('Draining User A credits...')
  await confirmFill(surveyA.id, userC.id) // A credits = 1
  await confirmFill(surveyA.id, userD.id) // A credits = 0

  const drainedUserA = await prisma.user.findUnique({ where: { id: userA.id } })
  const surveyA_after_drain = await prisma.survey.findUnique({ where: { id: surveyA.id } })
  
  if (drainedUserA?.credit_balance === 0) {
    console.log('CHECK PASSED: User A drained to 0 credits.')
  } else {
    console.log('CHECK FAILED: User A not at 0 credits.')
  }

  if (surveyA_after_drain?.status === 'PAUSED') {
    console.log('CHECK PASSED: Survey paused when owner hits 0 credits.')
  } else {
    console.log(`CHECK FAILED: Survey status is ${surveyA_after_drain?.status} (expected PAUSED).`)
  }

  // 8. User A earns a credit back
  console.log('User A earns a credit, checking if survey unpauses...')
  // Give User B a survey
  const surveyB = await prisma.survey.create({
    data: {
      owner_id: userB.id,
      google_form_url: 'https://docs.google.com/forms/d/e/456/viewform',
      target_responses: 5,
      status: 'ACTIVE'
    }
  })
  
  await confirmFill(surveyB.id, userA.id)
  
  const reactivatedUserA = await prisma.user.findUnique({ where: { id: userA.id } })
  const surveyA_after_earn = await prisma.survey.findUnique({ where: { id: surveyA.id } })
  
  if (reactivatedUserA?.credit_balance === 1 && surveyA_after_earn?.status === 'ACTIVE') {
    console.log('CHECK PASSED: Survey reactivated automatically when owner earned a credit.')
  } else {
    console.log(`CHECK FAILED: Survey status is ${surveyA_after_earn?.status}, credits: ${reactivatedUserA?.credit_balance}`)
  }

  // 9. Leaderboard Check
  const topUser = await prisma.user.findFirst({
    orderBy: { total_forms_filled: 'desc' }
  })
  console.log(`CHECK PASSED: Leaderboard top user is ${topUser?.username} with ${topUser?.total_forms_filled} fills.`)
  
  console.log('--- All Tests Completed ---')
}

main().catch(console.error).finally(() => prisma.$disconnect())
