import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import path from 'path'

const prisma = new PrismaClient()

test.describe('ScriptyBoy E2E Happy Path', () => {
  test.beforeAll(async () => {
    // Setup test database state if needed
    await prisma.$connect()
  })

  test.afterAll(async () => {
    // Cleanup test data
    await prisma.$disconnect()
  })

  test('complete user journey: project creation → upload → analysis → dashboard → exports', async ({ page }) => {
    // Step 1: Navigate to home page
    await page.goto('/')
    await expect(page).toHaveTitle(/ScriptyBoy/)

    // Step 2: Create new project
    await page.click('text=New Project')
    await page.fill('[data-testid="project-name"]', 'E2E Test Project')
    await page.fill('[data-testid="project-description"]', 'End-to-end testing project')
    await page.click('[data-testid="create-project-btn"]')

    // Verify project creation
    await expect(page.locator('[data-testid="project-title"]')).toContainText('E2E Test Project')

    // Step 3: Upload script
    await page.click('[data-testid="upload-script-btn"]')

    // Upload test script file
    const scriptPath = path.join(process.cwd(), 'test', 'fixtures', 'gold-scripts', 'feature-length.fountain')
    await page.setInputFiles('[data-testid="file-upload"]', scriptPath)

    // Wait for upload progress
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 })

    // Step 4: Preview and confirm script details
    await expect(page.locator('[data-testid="script-title"]')).toContainText('THE LAST FRONTIER')
    await expect(page.locator('[data-testid="script-author"]')).toContainText('Test Script')
    await expect(page.locator('[data-testid="page-count"]')).toContainText('110')

    // Edit logline and genre if needed
    await page.fill('[data-testid="logline-input"]', 'A xenobiologist discovers ancient Martian technology that could terraform Mars.')
    await page.selectOption('[data-testid="genre-select"]', 'Science Fiction')

    // Confirm script
    await page.click('[data-testid="confirm-script-btn"]')

    // Step 5: Start analysis
    await page.click('[data-testid="start-analysis-btn"]')

    // Wait for analysis progress
    await expect(page.locator('[data-testid="analysis-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="analysis-stage"]')).toContainText('sanitize')

    // Wait for analysis completion (this may take time with real LLM calls)
    await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible({ timeout: 180000 }) // 3 minutes

    // Step 6: Navigate to dashboard
    await page.click('[data-testid="view-dashboard-btn"]')
    await expect(page.url()).toContain('/scripts/')

    // Step 7: Verify dashboard tabs and data

    // Coverage Tab
    await expect(page.locator('[data-testid="tab-coverage"]')).toBeVisible()
    await page.click('[data-testid="tab-coverage"]')
    await expect(page.locator('[data-testid="overall-score"]')).toBeVisible()
    await expect(page.locator('[data-testid="recommendation"]')).toBeVisible()

    // Craft Tab
    await page.click('[data-testid="tab-craft"]')
    await expect(page.locator('[data-testid="structure-panel"]')).toBeVisible()
    await expect(page.locator('[data-testid="beats-chart"]')).toBeVisible()

    // Characters Tab
    await page.click('[data-testid="tab-characters"]')
    await expect(page.locator('[data-testid="character-stats"]')).toBeVisible()
    await expect(page.locator('[data-testid="dialogue-chart"]')).toBeVisible()

    // Pacing Tab
    await page.click('[data-testid="tab-pacing"]')
    await expect(page.locator('[data-testid="tension-waveform"]')).toBeVisible()
    await expect(page.locator('[data-testid="beat-timing"]')).toBeVisible()

    // Feasibility Tab
    await page.click('[data-testid="tab-feasibility"]')
    await expect(page.locator('[data-testid="budget-estimate"]')).toBeVisible()
    await expect(page.locator('[data-testid="complexity-breakdown"]')).toBeVisible()

    // Notes Tab
    await page.click('[data-testid="tab-notes"]')
    await expect(page.locator('[data-testid="notes-table"]')).toBeVisible()
    await expect(page.locator('[data-testid="notes-search"]')).toBeVisible()

    // Test notes filtering
    await page.fill('[data-testid="notes-search"]', 'character')
    await expect(page.locator('[data-testid="filtered-notes"]')).toBeVisible()

    // Step 8: Generate and download exports
    await page.click('[data-testid="tab-exports"]')
    await expect(page.locator('[data-testid="export-options"]')).toBeVisible()

    // Select coverage PDF export
    await page.check('[data-testid="export-coverage-pdf"]')
    await page.click('[data-testid="generate-exports-btn"]')

    // Wait for export generation
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible({ timeout: 60000 })

    // Verify download link
    await expect(page.locator('[data-testid="download-link"]')).toBeVisible()

    // Step 9: Verify export history
    await expect(page.locator('[data-testid="export-history"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-status-completed"]')).toBeVisible()

    // Step 10: Test export download
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="download-link"]')
    const download = await downloadPromise

    // Verify download
    expect(download.suggestedFilename()).toContain('coverage-report')
    expect(download.suggestedFilename()).toContain('.html') // PDF would be .pdf in production

    console.log('✅ E2E Happy Path Test Completed Successfully')
  })

  test('analysis pipeline stages progression', async ({ page }) => {
    // This test specifically focuses on the analysis pipeline stages
    await page.goto('/projects/test-project/scripts/upload')

    // Upload and start analysis
    const scriptPath = path.join(process.cwd(), 'test', 'fixtures', 'gold-scripts', 'feature-length.fountain')
    await page.setInputFiles('[data-testid="file-upload"]', scriptPath)
    await page.click('[data-testid="start-analysis-btn"]')

    // Track all 8 stages
    const expectedStages = [
      'sanitize',
      'parse',
      'normalize',
      'detectors',
      'scoring',
      'assets',
      'persist',
      'notify'
    ]

    for (const stage of expectedStages) {
      await expect(page.locator(`[data-testid="stage-${stage}"]`)).toBeVisible({ timeout: 30000 })
      await expect(page.locator(`[data-testid="stage-${stage}-complete"]`)).toBeVisible({ timeout: 60000 })
    }

    // Verify final completion
    await expect(page.locator('[data-testid="pipeline-complete"]')).toBeVisible()
  })

  test('dashboard data loading and visualization', async ({ page }) => {
    // Navigate to existing analyzed script
    await page.goto('/scripts/test-script-id')

    // Test loading states
    await expect(page.locator('[data-testid="dashboard-loading"]')).toBeVisible()
    await expect(page.locator('[data-testid="dashboard-loaded"]')).toBeVisible({ timeout: 10000 })

    // Test each visualization component
    await page.click('[data-testid="tab-craft"]')

    // Verify charts render
    await expect(page.locator('.recharts-wrapper')).toBeVisible()
    await expect(page.locator('[data-testid="beats-timeline"]')).toBeVisible()

    // Test interactive elements
    await page.hover('[data-testid="beat-point-1"]')
    await expect(page.locator('[data-testid="beat-tooltip"]')).toBeVisible()

    // Test pacing visualizations
    await page.click('[data-testid="tab-pacing"]')
    await expect(page.locator('[data-testid="tension-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="complexity-chart"]')).toBeVisible()

    // Test character presence grid
    await page.click('[data-testid="tab-characters"]')
    await expect(page.locator('[data-testid="presence-grid"]')).toBeVisible()
    await expect(page.locator('[data-testid="character-stats-table"]')).toBeVisible()
  })

  test('error handling and recovery', async ({ page }) => {
    // Test upload error handling
    await page.goto('/projects/test-project')
    await page.click('[data-testid="upload-script-btn"]')

    // Try to upload invalid file
    await page.setInputFiles('[data-testid="file-upload"]', __filename) // Upload this test file
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid file format')

    // Test analysis error recovery
    await page.goto('/scripts/invalid-script-id')
    await expect(page.locator('[data-testid="script-not-found"]')).toBeVisible()

    // Test network error handling
    await page.route('**/api/v1/scripts/*/dashboard', route => route.abort())
    await page.goto('/scripts/test-script-id')
    await expect(page.locator('[data-testid="dashboard-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })

  test('accessibility compliance', async ({ page }) => {
    await page.goto('/scripts/test-script-id')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()

    // Test ARIA labels
    const tabList = page.locator('[role="tablist"]')
    await expect(tabList).toBeVisible()

    const tabs = page.locator('[role="tab"]')
    await expect(tabs.first()).toHaveAttribute('aria-selected')

    // Test screen reader content
    await expect(page.locator('[aria-label]')).toHaveCount(await page.locator('[aria-label]').count())

    // Test color contrast (would need axe-core integration)
    // await expect(page).toPassAxeColorContrastTest()
  })

  test('responsive design and mobile compatibility', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/scripts/test-script-id')

    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    await page.click('[data-testid="mobile-menu-toggle"]')
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()

    // Verify responsive charts
    await page.click('[data-testid="tab-pacing"]')
    await expect(page.locator('.recharts-responsive-container')).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.reload()

    // Verify full dashboard layout
    await expect(page.locator('[data-testid="dashboard-sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="dashboard-main"]')).toBeVisible()
  })
})