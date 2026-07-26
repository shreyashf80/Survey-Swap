import { prisma } from '../src/lib/prisma'

async function main() {
  const users = await prisma.user.findMany({ take: 2 })
  
  if (users.length === 0) {
    console.log("No users found in the database. Please create some users first.")
    return
  }
  
  const user1 = users[0]
  const user2 = users.length > 1 ? users[1] : users[0]

  console.log(`Adding surveys for users: ${user1.username} and ${user2.username}`)

  const s1 = await prisma.survey.create({
    data: {
      owner_id: user1.id,
      google_form_url: 'https://docs.google.com/forms/d/e/1FAIpQLSfDUMMY_DUMMY_1/viewform?usp=sf_link',
      target_responses: 50,
      current_responses: 12,
      status: 'ACTIVE'
    }
  })

  const s2 = await prisma.survey.create({
    data: {
      owner_id: user2.id,
      google_form_url: 'https://docs.google.com/forms/d/e/1FAIpQLSfDUMMY_DUMMY_2/viewform?usp=sf_link',
      target_responses: 20,
      current_responses: 4,
      status: 'ACTIVE'
    }
  })

  console.log("✅ Successfully added 2 dummy surveys!")
  console.log("- Survey 1 ID:", s1.id)
  console.log("- Survey 2 ID:", s2.id)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
