// Mock implementation of VS Code API for testing

export const Uri = {
  file: jest.fn((path: string) => ({ fsPath: path, scheme: 'file', path })),
  parse: jest.fn((uri: string) => ({ fsPath: uri, scheme: 'file', path: uri })),
  joinPath: jest.fn((base: any, ...paths: string[]) => ({
    fsPath: `${base.fsPath}/${paths.join('/')}`,
    scheme: 'file',
    path: `${base.path}/${paths.join('/')}`
  }))
};

export const Range = jest.fn().mockImplementation((start, end) => ({ start, end }));
export const Position = jest.fn().mockImplementation((line, character) => ({ line, character }));
export const Selection = jest.fn().mockImplementation((start, end) => ({ start, end }));

export const window = {
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showQuickPick: jest.fn(),
  showInputBox: jest.fn(),
  createOutputChannel: jest.fn(() => ({
    appendLine: jest.fn(),
    append: jest.fn(),
    show: jest.fn(),
    hide: jest.fn(),
    dispose: jest.fn()
  })),
  activeTextEditor: undefined,
  visibleTextEditors: [],
  onDidChangeActiveTextEditor: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeVisibleTextEditors: jest.fn(),
  createWebviewPanel: jest.fn(() => ({
    webview: {
      html: '',
      postMessage: jest.fn(),
      onDidReceiveMessage: jest.fn()
    },
    onDidDispose: jest.fn(),
    dispose: jest.fn()
  })),
  createTextEditorDecorationType: jest.fn(() => ({ dispose: jest.fn() })),
  showTextDocument: jest.fn(),
  createTerminal: jest.fn(() => ({
    sendText: jest.fn(),
    show: jest.fn(),
    dispose: jest.fn()
  }))
};

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn(),
    update: jest.fn(),
    has: jest.fn()
  })),
  workspaceFolders: [],
  onDidChangeConfiguration: jest.fn(() => ({ dispose: jest.fn() })),
  onDidChangeWorkspaceFolders: jest.fn(),
  onDidSaveTextDocument: jest.fn(() => ({ dispose: jest.fn() })),
  findFiles: jest.fn(),
  openTextDocument: jest.fn(),
  saveAll: jest.fn(),
  getWorkspaceFolder: jest.fn(),
  asRelativePath: jest.fn(),
  textDocuments: [],
  fs: {
    writeFile: jest.fn(),
    readFile: jest.fn(),
    stat: jest.fn()
  }
};

export const commands = {
  registerCommand: jest.fn(),
  executeCommand: jest.fn(),
  getCommands: jest.fn()
};

export const languages = {
  createDiagnosticCollection: jest.fn(() => ({
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    dispose: jest.fn()
  })),
  registerCodeActionsProvider: jest.fn(),
  registerHoverProvider: jest.fn(),
  registerCompletionItemProvider: jest.fn()
};

export const chat = {
  createChatParticipant: jest.fn(() => ({
    iconPath: undefined,
    requestHandler: jest.fn(),
    followupProvider: jest.fn(),
    dispose: jest.fn()
  }))
};

export const notebooks = {
  registerNotebookCellStatusBarItemProvider: jest.fn(),
  createNotebookController: jest.fn(() => ({
    id: 'test-controller',
    notebookType: 'test',
    label: 'Test Controller',
    executeHandler: jest.fn(),
    dispose: jest.fn()
  }))
};

export const extensions = {
  getExtension: jest.fn(() => ({
    extensionUri: Uri.file('/mock/extension/path')
  }))
};

export const ExtensionContext = {
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
};

export const DiagnosticSeverity = {
  Error: 0,
  Warning: 1,
  Information: 2,
  Hint: 3
};

export const StatusBarAlignment = {
  Left: 1,
  Right: 2
};

export const ViewColumn = {
  Active: -1,
  Beside: -2,
  One: 1,
  Two: 2,
  Three: 3
};

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3
};

export const ProgressLocation = {
  SourceControl: 1,
  Window: 10,
  Notification: 15
};

export const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2
};

export const NotebookCellKind = {
  Markup: 1,
  Code: 2
};

// Export commonly used enums and classes
export const CancellationToken = {
  isCancellationRequested: false,
  onCancellationRequested: jest.fn()
};

export const Disposable = {
  from: jest.fn((...disposables) => ({
    dispose: jest.fn(() => {
      disposables.forEach(d => d && d.dispose && d.dispose());
    })
  }))
};

export const EventEmitter = jest.fn().mockImplementation(() => ({
  event: jest.fn(),
  fire: jest.fn(),
  dispose: jest.fn()
}));