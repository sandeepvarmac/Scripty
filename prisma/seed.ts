import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default roles
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Standard user with basic access',
      permissions: [
        'scripts:upload',
        'scripts:read',
        'scripts:delete',
        'analysis:read',
        'profile:read',
        'profile:update',
      ],
      isDefault: true,
    },
  })

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full system access',
      permissions: [
        'scripts:upload',
        'scripts:read',
        'scripts:delete',
        'scripts:manage_all',
        'analysis:read',
        'analysis:manage_all',
        'users:read',
        'users:manage',
        'roles:read',
        'roles:manage',
        'organizations:read',
        'organizations:manage',
        'billing:read',
        'billing:manage',
        'analytics:read',
        'system:admin',
      ],
      isDefault: false,
    },
  })

  console.log('✅ Default roles created:', {
    user: userRole.id,
    admin: adminRole.id,
  })

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })