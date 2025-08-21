import { CodessaApiClient, ChatRequest, ChatResponse } from '../apiClient';
import axios from 'axios';
import * as vscode from 'vscode';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the eventsource module first
jest.mock('eventsource', () => {
  return jest.fn().mockImplementation(() => ({
    onmessage: null,
    onerror: null,
    onopen: null,
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: 1 // OPEN state
  }));
});

// Get the mocked EventSource
const MockEventSource = require('eventsource');

(global as any).EventSource = MockEventSource;

describe('CodessaApiClient', () => {
  let apiClient: CodessaApiClient;
  let mockAxiosInstance: any;
  let mockVscodeConfig: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock axios.create
    mockAxiosInstance = {
      post: jest.fn().mockResolvedValue({ data: {} }),
      defaults: {
        baseURL: '',
        headers: {
          common: {}
        }
      }
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Mock VS Code configuration
    mockVscodeConfig = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          'apiEndpoint': 'https://api.codessa.dev',
          'apiKey': 'test-api-key',
          'streamResponses': true
        };
        return config[key] ?? defaultValue;
      })
    };
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue(mockVscodeConfig);

    // Create API client instance
    apiClient = new CodessaApiClient();
  });

  describe('constructor and configuration', () => {
    it('should create instance with default configuration', () => {
      expect(apiClient).toBeInstanceOf(CodessaApiClient);
      expect(mockedAxios.create).toHaveBeenCalledWith({
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VSCode-Codessa-Extension/0.1.0'
        }
      });
    });

    it('should configure axios instance after updateConfiguration', () => {
      // The configuration is applied in updateConfiguration() which is called in constructor
      // Check that the configuration methods were called
      expect(mockVscodeConfig.get).toHaveBeenCalledWith('apiEndpoint', 'https://api.codessa.dev');
      expect(mockVscodeConfig.get).toHaveBeenCalledWith('apiKey', '');
      expect(mockVscodeConfig.get).toHaveBeenCalledWith('streamResponses', true);
    });
  });

  describe('updateConfiguration', () => {
    it('should update configuration from VS Code settings', () => {
      mockVscodeConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        const newConfig: Record<string, any> = {
          'apiEndpoint': 'https://new-api.codessa.dev',
          'apiKey': 'new-test-key',
          'streamResponses': false
        };
        return newConfig[key] ?? defaultValue;
      });

      apiClient.updateConfiguration();

      expect(mockAxiosInstance.defaults.baseURL).toBe('https://new-api.codessa.dev');
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('Bearer new-test-key');
    });

    it('should handle missing API key gracefully', () => {
      mockVscodeConfig.get.mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'apiKey') return '';
        return defaultValue;
      });

      apiClient.updateConfiguration();

      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('');
    });
  });

  describe('sendChatMessage', () => {
    const mockRequest: ChatRequest = {
      message: 'Hello, world!',
      context: {
        workspaceRoot: '/test/workspace',
        activeFile: 'test.ts'
      }
    };

    const mockResponse: ChatResponse = {
      content: 'Hello! How can I help you?',
      actions: [{
        type: 'edit',
        target: 'test.ts',
        content: 'console.log("Hello");'
      }]
    };

    describe('synchronous mode', () => {
      beforeEach(() => {
        // Disable streaming for sync tests
        mockVscodeConfig.get.mockImplementation((key: string, defaultValue?: any) => {
          if (key === 'streamResponses') return false;
          const config: Record<string, any> = {
            'apiEndpoint': 'https://api.codessa.dev',
            'apiKey': 'test-api-key'
          };
          return config[key] ?? defaultValue;
        });
        apiClient.updateConfiguration();
      });

      it('should send chat message and return response', async () => {
        mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

        const result = await apiClient.sendChatMessage(mockRequest);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/chat', {
          ...mockRequest,
          stream: false
        });
        expect(result).toEqual(mockResponse);
      });

      it('should handle API errors gracefully', async () => {
        const errorMessage = 'Network error';
        mockAxiosInstance.post.mockRejectedValue(new Error(errorMessage));

        await expect(apiClient.sendChatMessage(mockRequest))
          .rejects.toThrow(`Failed to send chat message: Error: ${errorMessage}`);
      });
    });

    describe('streaming mode', () => {
      let mockEventSource: any;
      let onChunkCallback: jest.Mock;
      let onActionCallback: jest.Mock;

      beforeEach(() => {
        onChunkCallback = jest.fn();
        onActionCallback = jest.fn();

        mockEventSource = {
          onmessage: null,
          onerror: null,
          onopen: null,
          close: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          readyState: 1 // OPEN state
        };
        MockEventSource.mockImplementation(() => mockEventSource);
      });

      it('should handle streaming chat messages', async () => {
        // Mock the EventSource constructor to return our mock immediately
        let eventSourceInstance: any;
        MockEventSource.mockImplementation((url: string) => {
          eventSourceInstance = mockEventSource;
          // Simulate immediate connection success
          setTimeout(() => {
            if (eventSourceInstance.onopen) {
              eventSourceInstance.onopen();
            }
          }, 0);
          return mockEventSource;
        });

        const promise = apiClient.sendChatMessage(mockRequest, onChunkCallback, onActionCallback);

        // Wait a bit for the EventSource to be created and opened
        await new Promise(resolve => setTimeout(resolve, 50));

        // Simulate streaming events
        if (eventSourceInstance && eventSourceInstance.onmessage) {
          // Simulate content chunk
          eventSourceInstance.onmessage({
            data: JSON.stringify({
              type: 'content',
              content: 'Hello! '
            })
          });

          // Simulate another content chunk
          eventSourceInstance.onmessage({
            data: JSON.stringify({
              type: 'content',
              content: 'How can I help?'
            })
          });

          // Simulate action
          eventSourceInstance.onmessage({
            data: JSON.stringify({
              type: 'action',
              action: mockResponse.actions![0]
            })
          });

          // Simulate completion
          eventSourceInstance.onmessage({
            data: JSON.stringify({
              type: 'done'
            })
          });
        }

        const result = await promise;

        expect(onChunkCallback).toHaveBeenCalledWith('Hello! ');
        expect(onChunkCallback).toHaveBeenCalledWith('How can I help?');
        expect(onActionCallback).toHaveBeenCalledWith(mockResponse.actions![0]);
        expect(result.content).toBe('Hello! How can I help?');
        expect(result.actions).toEqual([mockResponse.actions![0]]);
        expect(mockEventSource.close).toHaveBeenCalled();
      });

      it('should handle streaming errors', async () => {
        const promise = apiClient.sendChatMessage(mockRequest, onChunkCallback);

        setTimeout(() => {
          if (mockEventSource.onerror) {
            mockEventSource.onerror(new Error('Stream error'));
          }
        }, 0);

        await expect(promise).rejects.toThrow('Stream connection failed');
      });
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      const request: ChatRequest = { message: 'test' };
      mockAxiosInstance.post.mockRejectedValue(new Error('timeout of 30000ms exceeded'));

      await expect(apiClient.sendChatMessage(request))
        .rejects.toThrow('Failed to send chat message');
    });

    it('should handle invalid JSON responses', async () => {
      const request: ChatRequest = { message: 'test' };
      mockAxiosInstance.post.mockResolvedValue({ data: 'invalid json' });

      const result = await apiClient.sendChatMessage(request);
      expect(result).toBe('invalid json');
    });
  });
});