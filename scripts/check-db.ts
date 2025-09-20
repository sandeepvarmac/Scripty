import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking Supabase database content...\n')

    // Check users table
    const userCount = await prisma.user.count()
    console.log(`👥 Users table: ${userCount} rows`)

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          plan: true,
          createdAt: true
        },
        take: 5
      })
      console.log('   Sample users:')
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.firstName} ${user.lastName}) - ${user.plan}`)
      })
    }

    // Check other main tables
    const subscriptionCount = await prisma.subscription.count()
    console.log(`\n💳 Subscriptions table: ${subscriptionCount} rows`)

    const usageCount = await prisma.usageRecord.count()
    console.log(`📈 Usage records table: ${usageCount} rows`)

    const sessionCount = await prisma.session.count()
    console.log(`🔐 Sessions table: ${sessionCount} rows`)

    console.log('\n✅ Database check complete!')

  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()