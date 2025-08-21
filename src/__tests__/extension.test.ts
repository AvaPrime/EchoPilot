import * as vscode from 'vscode';
import { activate, deactivate } from '../extension';
import { CodessaApiClient } from '../api/apiClient';
import { CodessaChatParticipant } from '../chat/chatParticipant';
import { PolicyDiagnosticsProvider } from '../policy/diagnosticsProvider';
import { PlaybookNotebookController } from '../notebook/playbookController';

// Mock VS Code API
jest.mock('vscode', () => ({
  ExtensionContext: jest.fn(),
  commands: {
    registerCommand: jest.fn(() => ({ dispose: jest.fn() }))
  },
  workspace: {
    onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
    onDidSaveTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
    getConfiguration: jest.fn(() => ({
      get: jest.fn()
    }))
  },
  window: {
    showErrorMessage: jest.fn()
  }
}));

// Mock all components
jest.mock('../api/apiClient');
jest.mock('../chat/chatParticipant');
jest.mock('../policy/diagnosticsProvider');
jest.mock('../notebook/playbookController');

describe('Extension', () => {
  let mockContext: vscode.ExtensionContext;
  let mockApiClient: jest.Mocked<CodessaApiClient>;
  let mockChatParticipant: jest.Mocked<CodessaChatParticipant>;
  let mockPolicyProvider: jest.Mocked<PolicyDiagnosticsProvider>;
  let mockNotebookController: jest.Mocked<PlaybookNotebookController>;

  beforeEach(() => {
    mockContext = {
      subscriptions: [],
      extensionUri: { fsPath: '/test/extension' } as any,
      globalState: {
        get: jest.fn(),
        update: jest.fn()
      },
      secrets: {
        get: jest.fn(),
        store: jest.fn()
      }
    } as any;

    mockApiClient = {
      dispose: jest.fn()
    } as any;

    mockChatParticipant = {
      register: jest.fn(() => [{ dispose: jest.fn() }]),
      dispose: jest.fn()
    } as any;

    mockPolicyProvider = {
      register: jest.fn(() => [{ dispose: jest.fn() }]),
      checkAllPolicies: jest.fn(),
      checkDocumentPolicies: jest.fn(),
      dispose: jest.fn()
    } as any;

    mockNotebookController = {
      register: jest.fn(() => [{ dispose: jest.fn() }]),
      createNewPlaybook: jest.fn(),
      dispose: jest.fn()
    } as any;

    (CodessaApiClient as jest.MockedClass<typeof CodessaApiClient>).mockImplementation(() => mockApiClient);
    (CodessaChatParticipant as jest.MockedClass<typeof CodessaChatParticipant>).mockImplementation(() => mockChatParticipant);
    (PolicyDiagnosticsProvider as jest.MockedClass<typeof PolicyDiagnosticsProvider>).mockImplementation(() => mockPolicyProvider);
    (PlaybookNotebookController as jest.MockedClass<typeof PlaybookNotebookController>).mockImplementation(() => mockNotebookController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('activate', () => {
    it('should initialize and register all components', async () => {
      await activate(mockContext);

      expect(CodessaApiClient).toHaveBeenCalledWith();
      expect(CodessaChatParticipant).toHaveBeenCalledWith(mockApiClient);
      expect(PolicyDiagnosticsProvider).toHaveBeenCalledWith(mockApiClient);
      expect(PlaybookNotebookController).toHaveBeenCalledWith(mockApiClient);

      expect(mockChatParticipant.register).toHaveBeenCalled();
      expect(mockPolicyProvider.register).toHaveBeenCalled();
      expect(mockNotebookController.register).toHaveBeenCalled();
    });

    it('should register commands', async () => {
      await activate(mockContext);

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'codessa.runPlaybook',
        expect.any(Function)
      );
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'codessa.checkPolicies',
        expect.any(Function)
      );
    });

    it('should set up configuration change listener', async () => {
      await activate(mockContext);

      expect(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
    });

    it('should set up document save listener for policy checks', async () => {
      await activate(mockContext);

      expect(vscode.workspace.onDidSaveTextDocument).toHaveBeenCalled();
    });

    it('should add disposables to context subscriptions', async () => {
      await activate(mockContext);

      expect(mockContext.subscriptions.length).toBeGreaterThan(0);
    });
  });

  describe('commands', () => {
    beforeEach(async () => {
      await activate(mockContext);
    });

    it('should execute runPlaybook command', () => {
      const runPlaybookCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
        .find(call => call[0] === 'codessa.runPlaybook')[1];

      runPlaybookCommand();

      expect(mockNotebookController.createNewPlaybook).toHaveBeenCalled();
    });

    it('should execute checkPolicies command', () => {
      const checkPoliciesCommand = (vscode.commands.registerCommand as jest.Mock).mock.calls
        .find(call => call[0] === 'codessa.checkPolicies')[1];

      checkPoliciesCommand();

      expect(mockPolicyProvider.checkAllPolicies).toHaveBeenCalled();
    });
  });

  describe('configuration changes', () => {
    it('should handle configuration changes', async () => {
      await activate(mockContext);

      const configChangeHandler = (vscode.workspace.onDidChangeConfiguration as jest.Mock).mock.calls[0][0];
      const mockEvent = {
        affectsConfiguration: jest.fn(() => true)
      };

      configChangeHandler(mockEvent);

      expect(mockEvent.affectsConfiguration).toHaveBeenCalledWith('codessa');
    });
  });

  describe('document save handling', () => {
    it('should check policies on document save', async () => {
      await activate(mockContext);

      const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
      const mockDocument = {
        uri: { scheme: 'file' },
        languageId: 'typescript'
      };

      await saveHandler(mockDocument);

      expect(mockPolicyProvider.checkDocumentPolicies).toHaveBeenCalledWith(mockDocument);
    });

    it('should handle errors during policy check on save', async () => {
      await activate(mockContext);
      mockPolicyProvider.checkDocumentPolicies.mockRejectedValue(new Error('Policy check failed'));

      const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
      const mockDocument = {
        uri: { scheme: 'file' },
        languageId: 'typescript'
      };

      await expect(saveHandler(mockDocument)).resolves.not.toThrow();
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        'Failed to check policies: Policy check failed'
      );
    });

    it('should skip policy check for non-file schemes', async () => {
      await activate(mockContext);

      const saveHandler = (vscode.workspace.onDidSaveTextDocument as jest.Mock).mock.calls[0][0];
      const mockDocument = {
        uri: { scheme: 'untitled' },
        languageId: 'typescript'
      };

      await saveHandler(mockDocument);

      expect(mockPolicyProvider.checkDocumentPolicies).not.toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should dispose all resources', async () => {
      await activate(mockContext);
      await deactivate();

      expect(mockApiClient.dispose).toHaveBeenCalled();
      expect(mockChatParticipant.dispose).toHaveBeenCalled();
      expect(mockPolicyProvider.dispose).toHaveBeenCalled();
      expect(mockNotebookController.dispose).toHaveBeenCalled();
    });

    it('should handle deactivate when not activated', async () => {
      await expect(deactivate()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle activation errors gracefully', async () => {
      (CodessaApiClient as jest.MockedClass<typeof CodessaApiClient>).mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      await expect(activate(mockContext)).rejects.toThrow('Initialization failed');
    });
  });
});