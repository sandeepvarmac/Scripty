import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkNewDatabase() {
  try {
    console.log('🔍 Checking new roadmap schema in Supabase...\n')

    // Check main tables
    const userCount = await prisma.user.count()
    console.log(`👥 Users table: ${userCount} rows`)

    const authLogCount = await prisma.authLog.count()
    console.log(`🔒 Auth logs table: ${authLogCount} rows`)

    const subscriptionCount = await prisma.subscription.count()
    console.log(`💳 Subscriptions table: ${subscriptionCount} rows`)

    const usageRecordCount = await prisma.usageRecord.count()
    console.log(`📊 Usage records table: ${usageRecordCount} rows`)

    const roleCount = await prisma.role.count()
    console.log(`👤 Roles table: ${roleCount} rows`)

    const organizationCount = await prisma.organization.count()
    console.log(`🏢 Organizations table: ${organizationCount} rows`)

    console.log('\n✅ New schema verification complete!')
    console.log('🎉 Database is ready for authentication testing')

  } catch (error) {
    console.error('❌ Error checking new database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkNewDatabase()