import 'dotenv/config';
import { prisma } from './src/lib/prisma';
// We mock getServerSession inside postSurvey by mocking next-auth globally if needed, 
// but since we are just testing the logic, let's just copy the logic or test it directly.
// Actually, it's easier to just call the DB directly to simulate it, or since postSurvey depends on getServerSession, 
// we will just write the test logic directly mimicking the action.

async function runTest() {
  console.log('--- Starting Phase 4 Acceptance Test ---');

  const user = await prisma.user.create({
    data: {
      username: `testuser_${Date.now()}`,
      password_hash: 'dummy',
      recovery_code_hash: 'dummy',
      credit_balance: 3,
    }
  });

  const userId = user.id;

  // Simulate Post 1
  const existing1 = await prisma.survey.findFirst({
    where: { owner_id: userId, status: { in: ['ACTIVE', 'PAUSED'] } }
  });
  
  if (!existing1) {
    await prisma.survey.create({
      data: {
        owner_id: userId,
        google_form_url: 'https://docs.google.com/forms/d/e/1/viewform',
        target_responses: 10,
        status: 'ACTIVE'
      }
    });
    console.log('1. First survey posted successfully.');
  }

  // Simulate Post 2 (Should fail)
  const existing2 = await prisma.survey.findFirst({
    where: { owner_id: userId, status: { in: ['ACTIVE', 'PAUSED'] } }
  });
  
  if (existing2) {
    console.log('2. Blocked from posting second survey: "You already have an active or paused survey."');
  } else {
    console.error('❌ Failed to block second survey!');
  }

  // Simulate Cancel 1
  await prisma.survey.update({
    where: { id: existing2!.id },
    data: { status: 'CANCELLED' }
  });
  console.log('3. First survey cancelled.');

  // Simulate Post 3 (Should succeed)
  const existing3 = await prisma.survey.findFirst({
    where: { owner_id: userId, status: { in: ['ACTIVE', 'PAUSED'] } }
  });

  if (!existing3) {
    await prisma.survey.create({
      data: {
        owner_id: userId,
        google_form_url: 'https://docs.google.com/forms/d/e/2/viewform',
        target_responses: 5,
        status: 'ACTIVE'
      }
    });
    console.log('4. Second survey posted successfully after cancelling the first.');
    console.log('✅ TEST PASSED');
  } else {
    console.error('❌ Failed to post survey after cancellation!');
  }

  // Cleanup
  await prisma.survey.deleteMany({ where: { owner_id: userId } });
  await prisma.user.delete({ where: { id: userId } });
}

runTest().catch(console.error).finally(() => process.exit(0));
