import { prisma } from '../src/lib/prisma'
import { confirmFill } from '../src/app/actions/credits'

async function runTests() {
  console.log('--- RUNNING QA EDGE CASE TESTS ---')

  // Setup: Create dummy users
  const userA = await prisma.user.create({
    data: { username: 'test_a_' + Date.now(), name: 'Test A', password_hash: 'hash', recovery_code_hash: 'hash', credit_balance: 1 }
  })
  const userB = await prisma.user.create({
    data: { username: 'test_b_' + Date.now(), name: 'Test B', password_hash: 'hash', recovery_code_hash: 'hash', credit_balance: 1 }
  })
  const userC = await prisma.user.create({
    data: { username: 'test_c_' + Date.now(), name: 'Test C', password_hash: 'hash', recovery_code_hash: 'hash', credit_balance: 1 }
  })

  // TEST 1: Self-fill blocked
  console.log('\n[Test 1] Self-fill blocked')
  const surveyA = await prisma.survey.create({
    data: { owner_id: userA.id, google_form_url: 'http://test', target_responses: 5, current_responses: 0, status: 'ACTIVE' }
  })
  
  const selfFillRes = await confirmFill(surveyA.id, userA.id)
  if (selfFillRes.error) {
    console.log('✅ Passed: Self-fill blocked with error:', selfFillRes.error)
  } else {
    console.error('❌ Failed: Self-fill succeeded!')
  }

  // TEST 2 & 3: Concurrent last-credit race AND auto-pause
  // userA has 1 credit. surveyA is ACTIVE.
  // userB and userC try to fill it at the exact same time.
  console.log('\n[Test 2] Concurrent last-credit race')
  const p1 = confirmFill(surveyA.id, userB.id)
  const p2 = confirmFill(surveyA.id, userC.id)
  const [res1, res2] = await Promise.all([p1, p2])

  console.log('User B result:', res1)
  console.log('User C result:', res2)

  const updatedSurveyA = await prisma.survey.findUnique({ where: { id: surveyA.id } })
  const updatedUserA = await prisma.user.findUnique({ where: { id: userA.id } })
  
  if (updatedUserA?.credit_balance === 0 && updatedSurveyA?.current_responses === 1 && updatedSurveyA.status === 'PAUSED') {
    console.log('✅ Passed: Only one fill succeeded, balance is 0, status is PAUSED')
  } else {
    console.error('❌ Failed: Race condition not handled correctly', updatedUserA, updatedSurveyA)
  }

  // TEST 4: Paused survey auto-reactivates on new credit
  console.log('\n[Test 3] Paused survey auto-reactivates on new credit')
  // userA fills userB's survey to earn a credit
  const surveyB = await prisma.survey.create({
    data: { owner_id: userB.id, google_form_url: 'http://test2', target_responses: 5, current_responses: 0, status: 'ACTIVE' }
  })
  
  await confirmFill(surveyB.id, userA.id)
  
  const recheckedUserA = await prisma.user.findUnique({ where: { id: userA.id } })
  const recheckedSurveyA = await prisma.survey.findUnique({ where: { id: surveyA.id } })
  
  if (recheckedUserA?.credit_balance === 1 && recheckedSurveyA?.status === 'ACTIVE') {
    console.log('✅ Passed: Balance increased to 1, Survey auto-flipped to ACTIVE')
  } else {
    console.error('❌ Failed: Survey did not reactivate!', recheckedUserA, recheckedSurveyA)
  }

  // Cleanup
  await prisma.fillEvent.deleteMany({ where: { survey_id: { in: [surveyA.id, surveyB.id] } } })
  await prisma.creditTransaction.deleteMany({ where: { user_id: { in: [userA.id, userB.id, userC.id] } } })
  await prisma.survey.deleteMany({ where: { id: { in: [surveyA.id, surveyB.id] } } })
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id, userC.id] } } })
  console.log('\n--- TESTS COMPLETE ---')
}

runTests().catch(console.error).finally(() => prisma.$disconnect())
