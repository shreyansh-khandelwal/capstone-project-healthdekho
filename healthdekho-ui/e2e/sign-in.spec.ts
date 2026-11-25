import { expect, test } from '@playwright/test'

const customer = {
  email: 'customer@gmail.com',
  fullName: 'Demo Customer',
}

test('sign-in, protected navigation, and logout', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL('/login')
  await page.getByLabel('Email address').fill(customer.email)
  await page.locator('input[name="password"]').fill('password')
  await page.getByRole('button', { name: 'Show password' }).click()
  await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Sign in securely' }).click()

  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByRole('heading', { name: 'Welcome, Demo Customer' })).toBeVisible()
  await page.getByRole('link', { name: 'Policy Search' }).click()
  await expect(page).toHaveURL('/search')
  await expect(page.getByRole('heading', { name: 'Policy search' })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL('/login')
})

test('invalid credentials produce stable accessible feedback', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email address').fill('unknown@example.com')
  await page.locator('input[name="password"]').fill('wrong password')
  await page.getByRole('button', { name: 'Sign in securely' }).click()

  await expect(page.getByRole('alert')).toHaveText('Invalid email or password')
  await expect(page.getByRole('button', { name: 'Sign in securely' })).toBeEnabled()
})
