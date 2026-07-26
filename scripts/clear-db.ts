import { prisma } from '../src/lib/prisma'

async function clearDatabase() {
  console.log('🧹 Starting database cleanup...')

  try {
    // We must delete in this specific order to respect foreign key constraints!
    console.log('1. Deleting Admin Actions...')
    await prisma.adminAction.deleteMany()

    console.log('2. Deleting Fill Events...')
    await prisma.fillEvent.deleteMany()

    console.log('3. Deleting Credit Transactions...')
    await prisma.creditTransaction.deleteMany()

    console.log('4. Deleting Surveys...')
    await prisma.survey.deleteMany()

    console.log('5. Deleting Users...')
    await prisma.user.deleteMany()

    console.log('\n✅ Success! The database is now completely empty and ready for real users.')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabase()
