import { test, expect } from '@playwright/test'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { resolve, dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = resolve(__dirname, '..')

test.describe('Specter web UI smoke tests', () => {
  test.beforeAll(() => {
    execSync('npm run build', { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: 60000 })
  })

  test('page loads with correct title and heading', async ({ page }) => {
    await page.goto(`file://${resolve(PROJECT_ROOT, 'Module/webroot/index.html')}`)
    await expect(page).toHaveTitle(/Specter/)
    await expect(page.locator('h1')).toHaveText(/Specter/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('all page sections are present', async ({ page }) => {
    await page.goto(`file://${resolve(PROJECT_ROOT, 'Module/webroot/index.html')}`)
    await expect(page.locator('#home-page')).toBeAttached()
    await expect(page.locator('#control-page')).toBeAttached()
    await expect(page.locator('#settings-page')).toBeAttached()
    await expect(page.locator('#keybox-card')).toBeAttached()
  })

  test('theme switches are present', async ({ page }) => {
    await page.goto(`file://${resolve(PROJECT_ROOT, 'Module/webroot/index.html')}`)
    const switches = page.locator('md-switch')
    const count = await switches.count()
    expect(count).toBeGreaterThanOrEqual(12)
  })
})
