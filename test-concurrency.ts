import 'dotenv/config';
import { prisma } from './src/lib/prisma';
import { confirmFill } from './src/app/actions/credits';

async function runTest() {
  console.log('--- Starting Concurrency Test ---');

  // 1. Create a clean owner and two fillers
  const owner = await prisma.user.create({
    data: {
      username: `owner_${Date.now()}`,
      password_hash: 'dummy',
      recovery_code_hash: 'dummy',
      credit_balance: 1, // EXACTLY 1 CREDIT
    }
  });

  const filler1 = await prisma.user.create({
    data: {
      username: `filler1_${Date.now()}`,
      password_hash: 'dummy',
      recovery_code_hash: 'dummy',
      credit_balance: 0,
    }
  });

  const filler2 = await prisma.user.create({
    data: {
      username: `filler2_${Date.now()}`,
      password_hash: 'dummy',
      recovery_code_hash: 'dummy',
      credit_balance: 0,
    }
  });

  // 2. Create an ACTIVE survey for the owner
  const survey = await prisma.survey.create({
    data: {
      owner_id: owner.id,
      google_form_url: 'https://docs.google.com/forms/d/e/123/viewform',
      target_responses: 10,
      current_responses: 0,
      status: 'ACTIVE'
    }
  });

  console.log('Setup complete. Firing concurrent requests...');

  // 3. Fire two concurrent confirmFill calls
  const [res1, res2] = await Promise.all([
    confirmFill(survey.id, filler1.id),
    confirmFill(survey.id, filler2.id)
  ]);

  console.log('Result 1:', res1);
  console.log('Result 2:', res2);

  // 4. Verify balances
  const ownerAfter = await prisma.user.findUnique({ where: { id: owner.id } });
  const surveyAfter = await prisma.survey.findUnique({ where: { id: survey.id } });

  console.log('Owner final balance:', ownerAfter?.credit_balance);
  console.log('Survey final status:', surveyAfter?.status);

  if (ownerAfter?.credit_balance === 0 && surveyAfter?.status === 'PAUSED') {
    if ((res1.success && res2.error) || (res1.error && res2.success)) {
      console.log('✅ TEST PASSED: Only one request succeeded, balance is 0, survey is PAUSED.');
    } else {
      console.error('❌ TEST FAILED: Unexpected success/error combination.');
    }
  } else {
    console.error('❌ TEST FAILED: Balance is corrupted or survey state is wrong.');
  }

  // Cleanup
  await prisma.fillEvent.deleteMany({ where: { survey_id: survey.id } });
  await prisma.creditTransaction.deleteMany({ where: { related_survey_id: survey.id } });
  await prisma.survey.delete({ where: { id: survey.id } });
  await prisma.user.deleteMany({ where: { id: { in: [owner.id, filler1.id, filler2.id] } } });
}

runTest()
  .catch(console.error)
  .finally(() => process.exit(0));
