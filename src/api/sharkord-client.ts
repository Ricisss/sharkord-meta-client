/**
 * Sharkord API Client (Frontend adapted)
 * 
 * This module provides a client for interacting with the Sharkord server API.
 * It handles authentication and WebSocket connection via tRPC in the browser.
 */

import type { SharkordServerStateData } from "@/interfaces/SharkordServerStateData";
import type { AppRouterProxy } from "./types";
import { createTRPCProxyClient, createWSClient, wsLink } from "@trpc/client";

export interface ClientConfig {
    host: string;
    useSSL?: boolean;
}

export interface LoginCredentials {
    identity: string;
    password: string;
    invite?: string;
}

export interface LoginResponse {
    success: boolean;
    token: string;
}

export class SharkordClient {
    private config: ClientConfig;
    private token: string | null = null;
    private wsClient: ReturnType<typeof createWSClient> | null = null;
    private trpc: AppRouterProxy | null = null;
    private onDisconnect?: () => void;
    private isSocketOpen: boolean = false;
    private connectPromise: Promise<void> | null = null;
    private connectResolve: (() => void) | null = null;
    private logger: (msg: string) => void = (msg: string) => { console.log(this.config.host + " - " + msg) };

    constructor(config: ClientConfig) {
        this.config = config
    }

    /**
     * Set a logger function for the client
     */
    setLogger(logger: (msg: string) => void) {
        this.logger = logger;
    }

    /**
     * Login to the Sharkord server via HTTP
     */
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const protocol = this.config.useSSL ? "https" : "http";
        // host comes in as a full URL from ServerData usually, let's strip http/https if present
        let cleanHost = this.config.host;
        if (cleanHost.startsWith("http://")) cleanHost = cleanHost.substring(7);
        if (cleanHost.startsWith("https://")) cleanHost = cleanHost.substring(8);

        const url = `${protocol}://${cleanHost}/login`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            let errorData: any;
            try {
                errorData = await response.json();
            } catch (e) {
                const text = await response.text().catch(() => "");
                errorData = { error: `HTTP ${response.status}: ${text || response.statusText}` };
            }

            if (!errorData) {
                errorData = { error: `HTTP ${response.status} (No response body)` };
            }

            const message = errorData.errors
                ? (typeof errorData.errors === 'string' ? errorData.errors : JSON.stringify(errorData.errors))
                : (errorData.error || "Login failed");

            throw new Error(message);
        }

        const data = await response.json().catch(() => null) as LoginResponse;
        if (!data || !data.token) {
            throw new Error("Login succeeded but no token was returned");
        }
        this.token = data.token;
        return data;
    }

    /**
     * Connect to the Sharkord server via WebSocket (tRPC)
     */
    connect(): AppRouterProxy {
        if (this.trpc) {
            return this.trpc;
        }

        if (!this.token) {
            throw new Error("Must login before connecting to WebSocket");
        }

        const protocol = this.config.useSSL ? "wss" : "ws";
        let cleanHost = this.config.host;
        if (cleanHost.startsWith("http://")) cleanHost = cleanHost.substring(7);
        if (cleanHost.startsWith("https://")) cleanHost = cleanHost.substring(8);

        const wsUrl = `${protocol}://${cleanHost}`;

        this.logger(`🔌 Connecting to WebSocket`);

        this.isSocketOpen = false;
        this.connectPromise = new Promise((resolve) => {
            this.connectResolve = resolve;
        });

        this.wsClient = createWSClient({
            url: wsUrl,
            onOpen: () => {
                this.logger("🔌 WebSocket connected (OPEN)");
                this.isSocketOpen = true;
                this.connectResolve?.();
            },
            onClose: (cause?: { code?: number }) => {
                this.logger(`🔌 WebSocket closed: ${JSON.stringify(cause)}`);
                this.isSocketOpen = false;
                this.cleanup();
                this.onDisconnect?.();
            },
            connectionParams: async () => {
                this.logger("🔑 Providing connection params...");
                return {
                    token: this.token || "",
                };
            },
        });

        this.trpc = createTRPCProxyClient<any>({
            links: [
                wsLink({
                    client: this.wsClient,
                }),
            ],
        }) as unknown as AppRouterProxy;

        return this.trpc;
    }

    /**
     * Wait for the WebSocket to be connected
     */
    async waitConnected(timeoutMs: number = 5000): Promise<boolean> {
        if (this.isSocketOpen) return true;
        if (!this.connectPromise) return false;

        const timeout = new Promise<boolean>((resolve) =>
            setTimeout(() => resolve(false), timeoutMs)
        );

        return Promise.race([
            this.connectPromise.then(() => true),
            timeout
        ]);
    }

    /**
     * Get the tRPC client (must be connected first)
     */
    getTRPC(): AppRouterProxy {
        if (!this.trpc) {
            throw new Error("Not connected. Call connect() first.");
        }
        return this.trpc;
    }

    /**
     * Perform the Sharkord handshake and join flow to authenticate the session
     */
    async join(password?: string): Promise<SharkordServerStateData> {
        const trpc = this.getTRPC();

        this.logger("🤝 Performing handshake query...");
        try {
            await this.waitConnected();
            if (!this.isSocketOpen) {
                throw new Error("Handshake aborted: WebSocket not open");
            }

            const handshake = await trpc.others.handshake.query();
            if (!handshake || !handshake.handshakeHash) {
                throw new Error("Handshake failed: No handshake hash received");
            }

            this.logger(`🚀 Joining server with hash: ${handshake.handshakeHash.substring(0, 8)}...`);
            const data: SharkordServerStateData = await trpc.others.joinServer.query({
                handshakeHash: handshake.handshakeHash,
                password,
            });

            this.logger("✅ Joined and authenticated successfully");
            return data;
        } catch (error) {
            this.logger(`❌ Join/Handshake failed: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Send a message to a channel
     */
    async sendMessage(channelId: number, content: string, files: string[] = []): Promise<number> {
        const trpc = this.getTRPC();
        const messageId = await trpc.messages.send.mutate({
            channelId,
            content,
            files,
        });
        return messageId;
    }

    /**
     * Set a callback for when the connection is lost
     */
    setOnDisconnect(callback: () => void) {
        this.onDisconnect = callback;
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        this.cleanup();
    }

    private cleanup() {
        // Safe check for browser context WebSocket close since trpc ws client wraps things slightly differently here
        if (this.wsClient) {
            try {
                // @ts-ignore
                if (this.wsClient.getConnection && this.wsClient.getConnection()) {
                    // @ts-ignore
                    this.wsClient.getConnection().close();
                } else if (this.wsClient.close) { // fallback
                    this.wsClient.close();
                }
            } catch (e) {
                // Ignore errors during close
            }
            this.wsClient = null;
        }
        this.trpc = null;
        this.isSocketOpen = false;
        this.connectPromise = null;
        this.connectResolve = null;
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.trpc !== null && this.isSocketOpen;
    }

    /**
     * Get the current token
     */
    getToken(): string | null {
        return this.token;
    }
}
