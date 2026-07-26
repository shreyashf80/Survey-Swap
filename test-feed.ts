import 'dotenv/config';
import { prisma } from './src/lib/prisma';
import { confirmFill } from './src/app/actions/credits';

async function runTest() {
  console.log('--- Starting Phase 5 Acceptance Test ---');

  const me = await prisma.user.create({
    data: { username: `me_${Date.now()}`, password_hash: 'x', recovery_code_hash: 'x', credit_balance: 3 }
  });

  const other = await prisma.user.create({
    data: { username: `other_${Date.now()}`, password_hash: 'x', recovery_code_hash: 'x', credit_balance: 3 }
  });

  const mySurvey = await prisma.survey.create({
    data: { owner_id: me.id, google_form_url: 'http://my.form', target_responses: 5, status: 'ACTIVE' }
  });

  const otherSurvey = await prisma.survey.create({
    data: { owner_id: other.id, google_form_url: 'http://other.form', target_responses: 5, status: 'ACTIVE' }
  });

  // Query 1: Before filling
  const feed1 = await prisma.survey.findMany({
    where: {
      status: 'ACTIVE',
      owner_id: { not: me.id },
      fill_events: { none: { filler_id: me.id } }
    }
  });

  const hasMySurvey = feed1.some(s => s.id === mySurvey.id);
  const hasOtherSurvey = feed1.some(s => s.id === otherSurvey.id);

  if (!hasMySurvey && hasOtherSurvey) {
    console.log('1. Correct filtering before fill (own excluded, other included).');
  } else {
    console.error('❌ Failed filtering before fill!');
  }

  // Simulate fill
  await confirmFill(otherSurvey.id, me.id);

  // Query 2: After filling
  const feed2 = await prisma.survey.findMany({
    where: {
      status: 'ACTIVE',
      owner_id: { not: me.id },
      fill_events: { none: { filler_id: me.id } }
    }
  });

  const hasOtherSurveyAfter = feed2.some(s => s.id === otherSurvey.id);

  if (!hasOtherSurveyAfter) {
    console.log('2. Filled survey immediately removed from feed.');
    console.log('✅ TEST PASSED');
  } else {
    console.error('❌ Filled survey still in feed!');
  }

  // Cleanup
  await prisma.fillEvent.deleteMany({ where: { survey_id: otherSurvey.id } });
  await prisma.creditTransaction.deleteMany({ where: { related_survey_id: otherSurvey.id } });
  await prisma.survey.deleteMany({ where: { id: { in: [mySurvey.id, otherSurvey.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [me.id, other.id] } } });
}

runTest().catch(console.error).finally(() => process.exit(0));
