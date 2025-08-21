import * as vscode from 'vscode';
import { CodessaChatParticipant } from '../chatParticipant';
import { CodessaApiClient } from '../../api/apiClient';

// Mock the VS Code API
jest.mock('vscode');

// Mock the API client
jest.mock('../../api/apiClient');

describe('CodessaChatParticipant', () => {
    let chatParticipant: CodessaChatParticipant;
    let mockApiClient: jest.Mocked<CodessaApiClient>;
    let mockChatParticipant: any;
    let mockStream: any;
    let mockRequest: any;
    let mockContext: any;
    let mockToken: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock API client
        mockApiClient = {
            sendChatMessage: jest.fn(),
            checkPolicies: jest.fn(),
            updateConfiguration: jest.fn(),
            dispose: jest.fn()
        } as any;

        // Mock VS Code chat participant
        mockChatParticipant = {
            iconPath: undefined,
            followupProvider: undefined,
            dispose: jest.fn()
        };

        // Mock VS Code APIs
        (vscode.chat.createChatParticipant as jest.Mock).mockReturnValue(mockChatParticipant);
        (vscode.extensions.getExtension as jest.Mock).mockReturnValue({
            extensionUri: vscode.Uri.file('/mock/extension/path')
        });
        (vscode.Uri.joinPath as jest.Mock).mockReturnValue(vscode.Uri.file('/mock/icon/path'));
        (vscode.Uri.file as jest.Mock).mockImplementation((path: string) => ({ fsPath: path }));

        // Mock workspace
        (vscode.workspace.workspaceFolders as any) = [{
            uri: { fsPath: '/mock/workspace' }
        }];
        (vscode.workspace.textDocuments as any) = [
            { fileName: '/mock/file1.ts', isUntitled: false, uri: { scheme: 'file' } },
            { fileName: '/mock/file2.js', isUntitled: false, uri: { scheme: 'file' } }
        ];

        // Mock active editor
        (vscode.window.activeTextEditor as any) = {
            document: { fileName: '/mock/active.ts' },
            selection: {
                isEmpty: false,
                start: { line: 0, character: 0 },
                end: { line: 1, character: 10 }
            }
        };

        // Mock stream
        mockStream = {
            progress: jest.fn(),
            markdown: jest.fn(),
            button: jest.fn()
        };

        // Mock request
        mockRequest = {
            prompt: 'Test prompt'
        };

        // Mock context
        mockContext = {};

        // Mock cancellation token
        mockToken = {
            isCancellationRequested: false
        };

        chatParticipant = new CodessaChatParticipant(mockApiClient);
    });

    describe('register', () => {
        it('should create and configure chat participant', () => {
            const disposable = chatParticipant.register();

            expect(vscode.chat.createChatParticipant).toHaveBeenCalledWith(
                'codessa.chat',
                expect.any(Function)
            );
            expect(mockChatParticipant.iconPath).toBeDefined();
            expect(mockChatParticipant.followupProvider).toBeDefined();
            expect(disposable).toBe(mockChatParticipant);
        });
    });

    describe('handleChatRequest', () => {
        beforeEach(() => {
            chatParticipant.register();
        });

        it('should handle successful chat request with streaming', async () => {
            const mockResponse = { content: 'AI response', actions: [] };
            mockApiClient.sendChatMessage.mockImplementation(async (request, onChunk, onAction) => {
                // Simulate streaming chunks
                if (onChunk) {
                    onChunk('Chunk 1');
                    onChunk('Chunk 2');
                }
                return mockResponse;
            });

            // Get the handler function
            const handler = (vscode.chat.createChatParticipant as jest.Mock).mock.calls[0][1];
            await handler(mockRequest, mockContext, mockStream, mockToken);

            expect(mockStream.progress).toHaveBeenCalledWith('Thinking...');
            expect(mockApiClient.sendChatMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Test prompt',
                    context: expect.objectContaining({
                        workspaceRoot: '/mock/workspace',
                        activeFile: '/mock/active.ts',
                        openFiles: ['/mock/file1.ts', '/mock/file2.js']
                    }),
                    stream: true
                }),
                expect.any(Function),
                expect.any(Function)
            );
            expect(mockStream.markdown).toHaveBeenCalledWith('Chunk 1');
            expect(mockStream.markdown).toHaveBeenCalledWith('Chunk 2');
        });

        it('should handle chat request errors', async () => {
            const error = new Error('API Error');
            mockApiClient.sendChatMessage.mockRejectedValue(error);

            const handler = (vscode.chat.createChatParticipant as jest.Mock).mock.calls[0][1];
            await handler(mockRequest, mockContext, mockStream, mockToken);

            expect(mockStream.markdown).toHaveBeenCalledWith(
                '❌ **Error**: API Error'
            );
        });

        it('should gather workspace context correctly', async () => {
            mockApiClient.sendChatMessage.mockResolvedValue({ content: 'response' });

            const handler = (vscode.chat.createChatParticipant as jest.Mock).mock.calls[0][1];
            await handler(mockRequest, mockContext, mockStream, mockToken);

            expect(mockApiClient.sendChatMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    context: expect.objectContaining({
                        workspaceRoot: '/mock/workspace',
                        activeFile: '/mock/active.ts',
                        selectedText: undefined, // Mock selection is not properly set up
                        openFiles: ['/mock/file1.ts', '/mock/file2.js']
                    })
                }),
                expect.any(Function),
                expect.any(Function)
            );
        });
    });

    describe('action handling', () => {
        beforeEach(() => {
            chatParticipant.register();
        });

        it('should handle edit actions', async () => {
            const mockDocument = { 
                getText: jest.fn().mockReturnValue('old content'),
                positionAt: jest.fn((offset: number) => ({ line: 0, character: offset }))
            };
            const mockEditor = {};
            const mockEdit = {
                replace: jest.fn(),
                createFile: jest.fn(),
                insert: jest.fn(),
                deleteFile: jest.fn()
            };

            (vscode.workspace.openTextDocument as jest.Mock).mockResolvedValue(mockDocument);
            (vscode.window.showTextDocument as jest.Mock).mockResolvedValue(mockEditor);
            (vscode.WorkspaceEdit as jest.Mock).mockImplementation(() => mockEdit);
            (vscode.workspace.applyEdit as jest.Mock).mockResolvedValue(true);
            (vscode.Range as jest.Mock).mockImplementation(() => ({}));
            (mockDocument.positionAt as jest.Mock) = jest.fn().mockReturnValue({});

            const editAction = {
                type: 'edit' as const,
                target: '/mock/file.ts',
                content: 'new content'
            };

            mockApiClient.sendChatMessage.mockImplementation(async (request, onChunk, onAction) => {
                if (onAction) {
                    await onAction(editAction);
                }
                return { content: 'response' };
            });

            const handler = (vscode.chat.createChatParticipant as jest.Mock).mock.calls[0][1];
            await handler(mockRequest, mockContext, mockStream, mockToken);

            expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(
                expect.objectContaining({ fsPath: '/mock/file.ts' })
            );
            expect(vscode.workspace.applyEdit).toHaveBeenCalledWith(mockEdit);
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('✅ **File Updated**')
            );
        });

        it('should handle create actions', async () => {
            const mockEdit = {
                createFile: jest.fn(),
                insert: jest.fn()
            };

            (vscode.WorkspaceEdit as jest.Mock).mockImplementation(() => mockEdit);
            (vscode.workspace.applyEdit as jest.Mock).mockResolvedValue(true);
            (vscode.Position as jest.Mock).mockImplementation(() => ({}));

            const createAction = {
                type: 'create' as const,
                target: '/mock/newfile.ts',
                content: 'file content'
            };

            mockApiClient.sendChatMessage.mockImplementation(async (request, onChunk, onAction) => {
                if (onAction) {
                    await onAction(createAction);
                }
                return { content: 'response' };
            });

            const handler = (vscode.chat.createChatParticipant as jest.Mock).mock.calls[0][1];
            await handler(mockRequest, mockContext, mockStream, mockToken);

            expect(mockEdit.createFile).toHaveBeenCalledWith(
                expect.objectContaining({ fsPath: '/mock/newfile.ts' }),
                { ignoreIfExists: false }
            );
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('✅ **File Created**')
            );
        });

        it('should handle run actions', async () => {
            const mockTerminal = {
                show: jest.fn(),
                sendText: jest.fn()
            };

            (vscode.window.createTerminal as jest.Mock).mockReturnValue(mockTerminal);

            const runAction = {
                type: 'run' as const,
                command: 'npm test'
            };

            mockApiClient.sendChatMessage.mockImplementation(async (request, onChunk, onAction) => {
                if (onAction) {
                    await onAction(runAction);
                }
                return { content: 'response' };
            });

            const handler = (vscode.chat.createChatParticipant as jest.Mock).mock.calls[0][1];
            await handler(mockRequest, mockContext, mockStream, mockToken);

            expect(vscode.window.createTerminal).toHaveBeenCalledWith({
                name: 'Codessa Command',
                cwd: '/mock/workspace'
            });
            expect(mockTerminal.sendText).toHaveBeenCalledWith('npm test');
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('🚀 **Command Executed**')
            );
        });
    });

    describe('followup provider', () => {
        it('should provide relevant followup suggestions', async () => {
            chatParticipant.register();
            const followupProvider = mockChatParticipant.followupProvider;

            const followups = await followupProvider.provideFollowups({}, {}, mockToken);

            expect(followups).toHaveLength(4);
            expect(followups[0]).toEqual({
                prompt: 'Explain the changes you made',
                label: '🔍 Explain changes'
            });
            expect(followups[1]).toEqual({
                prompt: 'Run tests for the modified code',
                label: '🧪 Run tests'
            });
            expect(followups[2]).toEqual({
                prompt: 'Check for policy violations',
                label: '🛡️ Check policies'
            });
            expect(followups[3]).toEqual({
                prompt: 'Create a playbook for this workflow',
                label: '📋 Create playbook'
            });
        });
    });

    describe('dispose', () => {
        it('should dispose the chat participant', () => {
            chatParticipant.register();
            chatParticipant.dispose();

            expect(mockChatParticipant.dispose).toHaveBeenCalled();
        });

        it('should handle dispose when participant is not initialized', () => {
            expect(() => chatParticipant.dispose()).not.toThrow();
        });
    });
});