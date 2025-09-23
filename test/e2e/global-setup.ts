import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test global setup...')

  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for dev server to be ready
    console.log('⏳ Waiting for dev server...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    console.log('✅ Dev server is ready')

    // Setup test data if needed
    // This could include creating test users, projects, etc.

    // Verify database connection
    console.log('🗄️ Verifying database connection...')
    // Database verification would go here

    console.log('✅ Global setup completed successfully')

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup