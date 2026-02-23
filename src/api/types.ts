/**
 * Type definitions for Sharkord tRPC API
 * 
 * These types define the structure of the Sharkord API for use by the tRPC proxy client.
 */

export interface AppRouterProxy {
    messages: {
        send: {
            mutate(input: {
                channelId: number;
                content: string;
                files?: string[];
            }): Promise<number>;
        };
        edit: {
            mutate(input: {
                messageId: number;
                content: string;
            }): Promise<void>;
        };
        delete: {
            mutate(input: {
                messageId: number;
            }): Promise<void>;
        };
        onNew: {
            subscribe(input: void, options: {
                onData: (data: any) => void;
                onError?: (err: any) => void;
            }): { unsubscribe(): void };
        };
        onUpdate: {
            subscribe(input: void, options: {
                onData: (data: any) => void;
                onError?: (err: any) => void;
            }): { unsubscribe(): void };
        };
        onDelete: {
            subscribe(input: void, options: {
                onData: (data: any) => void;
                onError?: (err: any) => void;
            }): { unsubscribe(): void };
        };
    };
    channels: {
        onReadStateUpdate: {
            subscribe(input: void, options: {
                onData: (data: { channelId: number, count: number }) => void;
                onError?: (err: any) => void;
            }): { unsubscribe(): void };
        };
        markAsRead: {
            mutate(input: { channelId: number }): Promise<void>;
        };
    };
    others: {
        handshake: {
            query(): Promise<{ handshakeHash: string; hasPassword?: boolean }>;
        };
        joinServer: {
            query(input: {
                handshakeHash: string;
                password?: string;
            }): Promise<any>;
        };
    };
}

export interface TConnectionParams {
    token: string;
}
