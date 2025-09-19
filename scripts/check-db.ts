import { PrismaClient } from '../generated/prisma'

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
          first_name: true,
          last_name: true,
          subscription_tier: true,
          created_at: true
        },
        take: 5
      })
      console.log('   Sample users:')
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.first_name} ${user.last_name}) - ${user.subscription_tier}`)
      })
    }

    // Check other main tables
    const projectCount = await prisma.projects.count()
    console.log(`\n📂 Projects table: ${projectCount} rows`)

    const scriptCount = await prisma.scripts.count()
    console.log(`📄 Scripts table: ${scriptCount} rows`)

    const analysisCount = await prisma.analyses.count()
    console.log(`📊 Analyses table: ${analysisCount} rows`)

    const usageCount = await prisma.usage_logs.count()
    console.log(`📈 Usage logs table: ${usageCount} rows`)

    console.log('\n✅ Database check complete!')

  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()