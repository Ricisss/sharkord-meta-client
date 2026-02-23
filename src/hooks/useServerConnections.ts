import { useEffect, useRef, useState } from 'react';
import type { ServerData } from '../interfaces/ServerData';
import { SharkordClient } from '../api/sharkord-client';
import type { Channel, ChannelPermissions, SharkordServerStateData } from '@/interfaces/SharkordServerStateData';
import type { MessageData } from '@/interfaces/MessageData';

export interface ServerConnectionState {
    isOnline: boolean;
    unreadCount: number;
}

export function useServerConnections(servers: ServerData[], activeServerId: string | null) {
    const [connectionStates, setConnectionStates] = useState<Record<string, ServerConnectionState>>({});
    const clientsRef = useRef<Record<string, { client: SharkordClient, unsubscribers: (() => void)[] }>>({});
    const readStatesRef = useRef<Record<string, Record<number, number>>>({});
    const permittedChannelsRef = useRef<Record<string, Set<number>>>({});
    const serverLoginDataRef = useRef<Record<string, SharkordServerStateData>>({});

    // Cleanup function to disconnect a specific server client
    const cleanupClient = (serverId: string) => {
        const entry = clientsRef.current[serverId];
        if (entry) {
            if (entry.unsubscribers) {
                entry.unsubscribers.forEach(unsub => unsub());
            }
            entry.client.disconnect();
            delete clientsRef.current[serverId];
            delete permittedChannelsRef.current[serverId];
            delete serverLoginDataRef.current[serverId];
        }
    };

    useEffect(() => {
        const currentServerIds = new Set(servers.map(s => s.id));

        // 1. Cleanup removed servers
        Object.keys(clientsRef.current).forEach(serverId => {
            if (!currentServerIds.has(serverId)) {
                cleanupClient(serverId);
                setConnectionStates(prev => {
                    const next = { ...prev };
                    delete next[serverId];
                    return next;
                });
            }
        });

        // 2. Setup new servers
        servers.forEach(server => {
            if (!clientsRef.current[server.id]) {
                // Initialize default state
                setConnectionStates(prev => {
                    const existingCount = prev[server.id]?.unreadCount || 0;
                    return {
                        ...prev,
                        [server.id]: { isOnline: false, unreadCount: Math.max(0, existingCount) }
                    };
                });

                const client = new SharkordClient({
                    host: server.url,
                    useSSL: server.url.startsWith('https://')
                });

                client.setOnDisconnect(() => {
                    setConnectionStates(prev => {
                        const existingState = prev[server.id] || { isOnline: true, unreadCount: 0 };
                        return {
                            ...prev,
                            [server.id]: { ...existingState, isOnline: false }
                        };
                    });
                });

                clientsRef.current[server.id] = { client, unsubscribers: [] };

                // Connect logic
                const connectServer = async () => {
                    try {
                        // Attempt login
                        await client.login({
                            identity: server.identity,
                            password: server.password,
                        });

                        // Connect WS
                        const trpc = client.connect();

                        // Join server - returns initial data including readStates
                        serverLoginDataRef.current[server.id] = await client.join();

                        // Filter permitted channels (where user has VIEW_CHANNEL permission)
                        // The server filters joinData.channels to only those the user can access
                        const permittedIds = new Set<number>();

                        const channels = serverLoginDataRef.current[server.id]?.channels;
                        //Channels that are not private are permitted
                        if (channels) {
                            Object.values(channels).forEach((c: Channel) => {
                                if (!c.private) {
                                    permittedIds.add(c.id);
                                }
                            });
                        }

                        //Check individual channel permissions
                        const channelPermissions = serverLoginDataRef.current[server.id]?.channelPermissions;
                        if (channelPermissions) {
                            Object.values(channelPermissions).forEach((cp: ChannelPermissions) => {
                                if (cp.permissions.VIEW_CHANNEL && !permittedIds.has(cp.channelId)) {
                                    permittedIds.add(cp.channelId);
                                }
                            });
                        }

                        permittedChannelsRef.current[server.id] = permittedIds;

                        const initialReadStates = serverLoginDataRef.current[server.id]?.readStates || {};
                        readStatesRef.current[server.id] = initialReadStates;

                        const initialUnreadCount = Object.entries(initialReadStates).reduce((sum, [id, count]) => {
                            return sum + (permittedIds.has(Number(id)) ? (Number(count) || 0) : 0);
                        }, 0);

                        // Update state to online and set initial unread count
                        setConnectionStates(prev => {
                            const existingState = prev[server.id] || { isOnline: false, unreadCount: 0 };
                            return {
                                ...prev,
                                [server.id]: { ...existingState, isOnline: true, unreadCount: initialUnreadCount }
                            };
                        });

                        // Subscribe to new messages (incremental)
                        const msgSubscription = trpc.messages.onNew.subscribe(undefined, {
                            onData: (messageData: MessageData) => {
                                console.log(`[WS] New message from server ${server.name} (${server.id}):`, messageData);

                                const permitted = permittedChannelsRef.current[server.id];

                                //Check if user has VIEW_CHANNEL permission for this channel
                                if (!permitted?.has(messageData.channelId)) {
                                    console.log(`[WS] User does not have VIEW_CHANNEL permission for channel ${messageData.channelId}`);
                                    return;
                                }
                                //Check if current user is the sender
                                if (messageData.userId === serverLoginDataRef.current[server.id]?.ownUserId) {
                                    console.log(`[WS] Current user is the sender`);
                                    return;
                                }

                                // Update local ground truth for this channel
                                const currentStates = readStatesRef.current[server.id] || {};
                                currentStates[messageData.channelId] = (currentStates[messageData.channelId] || 0) + 1;
                                readStatesRef.current[server.id] = currentStates;

                                // Only increment if we are not the sender (though usually unread count handles this)
                                setConnectionStates(prev => {
                                    const existingState = prev[server.id] || { isOnline: true, unreadCount: 0 };
                                    return {
                                        ...prev,
                                        [server.id]: {
                                            ...existingState,
                                            unreadCount: existingState.unreadCount + 1
                                        }
                                    };
                                });
                            },
                            onError: (err) => {
                                console.error(`[WS] Message subscription error for server ${server.name}:`, err);
                            }
                        });

                        // Subscribe to read state updates (absolute per channel)
                        const readStateSubscription = trpc.channels.onReadStateUpdate.subscribe(undefined, {
                            onData: (data) => {
                                console.log(`[WS] Read state update for server ${server.name}:`, data);
                                const currentStates = readStatesRef.current[server.id] || {};
                                currentStates[data.channelId] = data.count;
                                readStatesRef.current[server.id] = currentStates;

                                const permitted = permittedChannelsRef.current[server.id] || new Set();
                                const totalUnread = Object.entries(currentStates).reduce((sum, [id, count]) => {
                                    return sum + (permitted.has(Number(id)) ? (Number(count) || 0) : 0);
                                }, 0);

                                setConnectionStates(prev => {
                                    const existingState = prev[server.id] || { isOnline: true, unreadCount: 0 };
                                    return {
                                        ...prev,
                                        [server.id]: {
                                            ...existingState,
                                            unreadCount: totalUnread
                                        }
                                    };
                                });
                            },
                            onError: (err) => {
                                console.error(`[WS] Read state subscription error for server ${server.name}:`, err);
                            }
                        });

                        const clientEntry = clientsRef.current[server.id];
                        if (clientEntry) {
                            clientEntry.unsubscribers.push(() => msgSubscription.unsubscribe());
                            clientEntry.unsubscribers.push(() => readStateSubscription.unsubscribe());
                        }

                    } catch (error) {
                        console.error(`Failed to connect to server ${server.name}:`, error);
                        setConnectionStates(prev => {
                            const existingState = prev[server.id] || { isOnline: false, unreadCount: 0 };
                            return {
                                ...prev,
                                [server.id]: { ...existingState, isOnline: false }
                            };
                        });
                    }
                };

                connectServer();
            }
        });

        // Cleanup on full unmount
        return () => {
            // We'll rely on the server array diffing above for cleanup.
        };
    }, [servers]); // Only run when servers list changes




    const markAsRead = async (serverId: string) => {
        // 1. Update local state for immediate feedback
        setConnectionStates(prev => {
            const existingState = prev[serverId];
            if (!existingState) return prev;
            return {
                ...prev,
                [serverId]: { ...existingState, unreadCount: 0 }
            };
        });

        // 2. Mark all channels as read on the server
        const entry = clientsRef.current[serverId];
        const serverReadStates = readStatesRef.current[serverId];

        if (entry && entry.client.isConnected() && serverReadStates) {
            const trpc = entry.client.getTRPC();

            // Filter channels that actually have unread messages and that we have permission to see
            const channelIdsToMark = Object.entries(serverReadStates)
                .filter(([id, count]) => (Number(count) || 0) > 0 && permittedChannelsRef.current[serverId]?.has(Number(id)))
                .map(([id, _]) => Number(id));

            console.log(`[WS] Marking ${channelIdsToMark.length} channels as read for server ${serverId}`);

            try {
                // Perform concurrently
                await Promise.all(channelIdsToMark.map((channelId) => {
                    console.log(`Marking channel ${channelId} as read`);
                    return trpc.channels.markAsRead.mutate({ channelId }).catch(e => {
                        console.error(`Failed to mark channel ${channelId} as read:`, e);
                    })
                }));

                // Update local ground truth ref
                channelIdsToMark.forEach(id => {
                    if (readStatesRef.current[serverId]) {
                        readStatesRef.current[serverId][id] = 0;
                    }
                });
            } catch (error) {
                console.error(`Error marking all as read for server ${serverId}:`, error);
            }
        }
    };

    return { connectionStates, markAsRead };
}
