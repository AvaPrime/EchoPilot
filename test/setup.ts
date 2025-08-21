// Jest setup file for VS Code extension testing

// VS Code API is mocked via moduleNameMapper in jest.config.js

// Global test setup
beforeAll(() => {
  // Setup global test environment
  process.env.NODE_ENV = 'test';
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});

// Global test utilities
(global as any).createMockContext = () => ({
  subscriptions: [],
  workspaceState: {
    get: jest.fn(),
    update: jest.fn()
  },
  globalState: {
    get: jest.fn(),
    update: jest.fn()
  },
  extensionPath: '/mock/extension/path',
  extensionUri: { fsPath: '/mock/extension/path' },
  secrets: {
    get: jest.fn(),
    store: jest.fn(),
    delete: jest.fn()
  }
});

// Suppress console output during tests unless explicitly needed
if (!process.env.VERBOSE_TESTS) {
  (global as any).console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}