import * as vscode from 'vscode';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import EventSource from 'eventsource';

export interface CodessaConfig {
    apiEndpoint: string;
    apiKey: string;
    streamResponses: boolean;
}

export interface ChatRequest {
    message: string;
    context?: {
        workspaceRoot?: string;
        activeFile?: string;
        selectedText?: string;
        openFiles?: string[];
    };
    stream?: boolean;
}

export interface ChatResponse {
    content: string;
    actions?: {
        type: 'edit' | 'create' | 'delete' | 'run';
        target: string;
        content?: string;
        command?: string;
    }[];
}

export interface PolicyCheckRequest {
    filePath: string;
    content: string;
    language: string;
}

export interface PolicyViolation {
    rule: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
    fix?: {
        description: string;
        edits: {
            range: vscode.Range;
            newText: string;
        }[];
    };
}

export interface PlaybookStep {
    id: string;
    type: 'plan' | 'search' | 'edit' | 'test' | 'analyze';
    description: string;
    input?: any;
    output?: any;
    status: 'pending' | 'running' | 'completed' | 'failed';
}

export class CodessaApiClient {
    private client: AxiosInstance;
    private config!: CodessaConfig; // Initialized in updateConfiguration()

    constructor() {
        this.updateConfiguration();
        this.client = axios.create({
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'VSCode-Codessa-Extension/0.1.0'
            }
        });
    }

    updateConfiguration(): void {
        const vscodeConfig = vscode.workspace.getConfiguration('codessa');
        this.config = {
            apiEndpoint: vscodeConfig.get('apiEndpoint', 'https://api.codessa.dev'),
            apiKey: vscodeConfig.get('apiKey', ''),
            streamResponses: vscodeConfig.get('streamResponses', true)
        };

        if (this.client) {
            this.client.defaults.baseURL = this.config.apiEndpoint;
            this.client.defaults.headers.common['Authorization'] = 
                this.config.apiKey ? `Bearer ${this.config.apiKey}` : '';
        }
    }

    protected configureWebHeaders(webEndpoint?: string): void {
        if (this.client) {
            if (webEndpoint) {
                this.client.defaults.baseURL = webEndpoint;
            }
            // Add CORS headers for web requests
            this.client.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
            this.client.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            this.client.defaults.headers.common['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
        }
    }

    async sendChatMessage(
        request: ChatRequest,
        onChunk?: (chunk: string) => void,
        onAction?: (action: any) => void
    ): Promise<ChatResponse> {
        if (this.config.streamResponses && onChunk) {
            return this.streamChatMessage(request, onChunk, onAction);
        } else {
            return this.sendChatMessageSync(request);
        }
    }

    private async sendChatMessageSync(request: ChatRequest): Promise<ChatResponse> {
        try {
            const response: AxiosResponse<ChatResponse> = await this.client.post('/chat', {
                ...request,
                stream: false
            });
            return response.data;
        } catch (error) {
            console.error('Error sending chat message:', error);
            throw new Error(`Failed to send chat message: ${error}`);
        }
    }

    private async streamChatMessage(
        request: ChatRequest,
        onChunk: (chunk: string) => void,
        onAction?: (action: any) => void
    ): Promise<ChatResponse> {
        return new Promise((resolve, reject) => {
            const url = `${this.config.apiEndpoint}/chat/stream`;
            const eventSource = new EventSource(url, {
                headers: {
                    'Authorization': this.config.apiKey ? `Bearer ${this.config.apiKey}` : '',
                    'Content-Type': 'application/json'
                }
            });

            let fullContent = '';
            const actions: any[] = [];

            eventSource.onmessage = (event: MessageEvent) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'content') {
                        fullContent += data.content;
                        onChunk(data.content);
                    } else if (data.type === 'action' && onAction) {
                        actions.push(data.action);
                        onAction(data.action);
                    } else if (data.type === 'done') {
                        eventSource.close();
                        resolve({ content: fullContent, actions });
                    }
                } catch (error) {
                    console.error('Error parsing stream data:', error);
                }
            };

            eventSource.onerror = (error: Event) => {
                console.error('EventSource error:', error);
                eventSource.close();
                reject(new Error('Stream connection failed'));
            };

            // Send the request data
            this.client.post('/chat/stream/init', {
                ...request,
                stream: true
            }).catch(reject);
        });
    }

    async checkPolicies(request: PolicyCheckRequest): Promise<PolicyViolation[]> {
        try {
            const response: AxiosResponse<{ violations: PolicyViolation[] }> = 
                await this.client.post('/policy/check', request);
            return response.data.violations;
        } catch (error) {
            console.error('Error checking policies:', error);
            throw new Error(`Failed to check policies: ${error}`);
        }
    }

    async executePlaybookStep(step: PlaybookStep): Promise<PlaybookStep> {
        try {
            const response: AxiosResponse<PlaybookStep> = 
                await this.client.post('/playbook/execute', step);
            return response.data;
        } catch (error) {
            console.error('Error executing playbook step:', error);
            throw new Error(`Failed to execute playbook step: ${error}`);
        }
    }

    dispose(): void {
        // Clean up any resources
    }
}