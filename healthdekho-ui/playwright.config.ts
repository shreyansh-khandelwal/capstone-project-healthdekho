import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: '..\\healthdekho\\mvnw.cmd -f ..\\healthdekho\\pom.xml spring-boot:run "-Dspring-boot.run.profiles=e2e"',
      url: 'http://127.0.0.1:8090/api/v1/auth/csrf',
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
