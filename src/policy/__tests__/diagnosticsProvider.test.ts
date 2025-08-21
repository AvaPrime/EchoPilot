import * as vscode from 'vscode';
import { PolicyDiagnosticsProvider } from '../diagnosticsProvider';
import { CodessaApiClient } from '../../api/apiClient';

// Mock VS Code API
jest.mock('vscode', () => ({
  languages: {
    createDiagnosticCollection: jest.fn(() => ({
      set: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn()
    })),
    registerCodeActionsProvider: jest.fn(() => ({ dispose: jest.fn() }))
  },
  window: {
    activeTextEditor: null,
    onDidChangeActiveTextEditor: jest.fn(() => ({ dispose: jest.fn() }))
  },
  workspace: {
    onDidSaveTextDocument: jest.fn(() => ({ dispose: jest.fn() }))
  },
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3
  },
  Range: jest.fn((start, end) => ({ start, end })),
  Position: jest.fn((line, character) => ({ line, character })),
  Diagnostic: jest.fn((range, message, severity) => ({ range, message, severity })),
  CodeActionKind: {
    QuickFix: 'quickfix'
  }
}));

// Mock CodessaApiClient
jest.mock('../../api/apiClient');

describe('PolicyDiagnosticsProvider', () => {
  let provider: PolicyDiagnosticsProvider;
  let mockApiClient: jest.Mocked<CodessaApiClient>;
  let mockDiagnosticCollection: any;

  beforeEach(() => {
    mockApiClient = {
      checkPolicies: jest.fn()
    } as any;

    mockDiagnosticCollection = {
      set: jest.fn(),
      clear: jest.fn(),
      dispose: jest.fn()
    };

    (vscode.languages.createDiagnosticCollection as jest.Mock).mockReturnValue(mockDiagnosticCollection);

    provider = new PolicyDiagnosticsProvider(mockApiClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create diagnostic collection and register providers', () => {
      const disposables = provider.register();

      expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalledWith('codessa-policy');
      expect(vscode.languages.registerCodeActionsProvider).toHaveBeenCalled();
      expect(vscode.window.onDidChangeActiveTextEditor).toHaveBeenCalled();
      expect(disposables).toHaveLength(3);
    });
  });

  describe('checkDocumentPolicies', () => {
    const mockDocument = {
      uri: { fsPath: '/test/file.ts' },
      getText: jest.fn(() => 'test content'),
      fileName: 'file.ts'
    } as any;

    it('should check policies and set diagnostics for violations', async () => {
      const mockViolations = [
        {
          line: 1,
          column: 5,
          message: 'Policy violation',
          severity: 'error' as const,
          rule: 'test-rule'
        }
      ];

      mockApiClient.checkPolicies.mockResolvedValue(mockViolations);

      await provider.checkDocumentPolicies(mockDocument);

      expect(mockApiClient.checkPolicies).toHaveBeenCalledWith({
        content: 'test content',
        filePath: '/test/file.ts',
        language: 'typescript'
      });
      expect(mockDiagnosticCollection.set).toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.checkPolicies.mockRejectedValue(new Error('API Error'));

      await expect(provider.checkDocumentPolicies(mockDocument)).resolves.not.toThrow();
      expect(mockDiagnosticCollection.clear).toHaveBeenCalledWith(mockDocument.uri);
    });

    it('should clear diagnostics when no violations found', async () => {
      mockApiClient.checkPolicies.mockResolvedValue([]);

      await provider.checkDocumentPolicies(mockDocument);

      expect(mockDiagnosticCollection.set).toHaveBeenCalledWith(mockDocument.uri, []);
    });
  });

  describe('checkAllPolicies', () => {
    it('should check policies for all open text documents', async () => {
      const mockDocuments = [
        { uri: { fsPath: '/test/file1.ts' }, getText: () => 'content1', fileName: 'file1.ts' },
        { uri: { fsPath: '/test/file2.ts' }, getText: () => 'content2', fileName: 'file2.ts' }
      ] as any[];

      (vscode.workspace as any).textDocuments = mockDocuments;
      mockApiClient.checkPolicies.mockResolvedValue([]);

      const checkDocumentSpy = jest.spyOn(provider, 'checkDocumentPolicies').mockResolvedValue();

      await provider.checkAllPolicies();

      expect(checkDocumentSpy).toHaveBeenCalledTimes(2);
      expect(checkDocumentSpy).toHaveBeenCalledWith(mockDocuments[0]);
      expect(checkDocumentSpy).toHaveBeenCalledWith(mockDocuments[1]);
    });
  });

  describe('dispose', () => {
    it('should dispose all resources', () => {
      provider.register();
      provider.dispose();

      expect(mockDiagnosticCollection.dispose).toHaveBeenCalled();
    });
  });

  describe('PolicyCodeActionProvider', () => {
    it('should provide code actions for policy violations', () => {
      const mockDocument = { uri: { fsPath: '/test/file.ts' } } as any;
      const mockRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 10));
      const mockContext = {
        diagnostics: [
          {
            message: 'Policy violation',
            range: mockRange,
            source: 'codessa-policy'
          }
        ]
      } as any;

      provider.register();
      const codeActionProvider = (vscode.languages.registerCodeActionsProvider as jest.Mock).mock.calls[0][1];
      const actions = codeActionProvider.provideCodeActions(mockDocument, mockRange, mockContext);

      expect(actions).toHaveLength(1);
      expect(actions[0].title).toBe('Ignore this policy violation');
      expect(actions[0].kind).toBe(vscode.CodeActionKind.QuickFix);
    });

    it('should return empty array when no policy diagnostics', () => {
      const mockDocument = { uri: { fsPath: '/test/file.ts' } } as any;
      const mockRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 10));
      const mockContext = {
        diagnostics: [
          {
            message: 'Other diagnostic',
            range: mockRange,
            source: 'other-source'
          }
        ]
      } as any;

      provider.register();
      const codeActionProvider = (vscode.languages.registerCodeActionsProvider as jest.Mock).mock.calls[0][1];
      const actions = codeActionProvider.provideCodeActions(mockDocument, mockRange, mockContext);

      expect(actions).toHaveLength(0);
    });
  });
});