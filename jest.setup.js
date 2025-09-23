import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_scriptyboy'
process.env.OPENAI_API_KEY = 'test-key'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Setup test database
beforeAll(async () => {
  // Database setup would go here in a real implementation
})

afterAll(async () => {
  // Database cleanup would go here
})

// Global test helpers
global.testHelpers = {
  createTestProject: async () => {
    // Helper to create test projects
  },
  createTestScript: async () => {
    // Helper to create test scripts
  },
  cleanupTestData: async () => {
    // Helper to cleanup test data
  }
}