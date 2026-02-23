import type { ServerData } from '@/interfaces/ServerData';
import React, { useState, useEffect } from 'react';

interface SidebarProps {
    servers: ServerData[];
    activeServerId: string | null;
    onSelectServer: (id: string) => void;
    onAddServer: () => void;
    onDeleteServer?: (id: string) => void;
    onEditServer?: (id: string) => void;
    connectionStates?: Record<string, { isOnline: boolean; unreadCount: number }>;
    onMarkAsRead?: (serverId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ servers, activeServerId, onSelectServer, onAddServer, onDeleteServer, onEditServer, connectionStates, onMarkAsRead }) => {
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, serverId: string } | null>(null);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleContextMenu = (e: React.MouseEvent, serverId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, serverId });
    };

    return (
        <div className="w-[72px] flex flex-col items-center py-3 gap-2 flex-shrink-0 border-r border-[#1E1F22] relative overflow-y-auto">
            {servers.map(server => {
                const state = connectionStates?.[server.id];
                return (
                    <div
                        key={server.id}
                        className="relative group flex items-center justify-center w-12 h-12 cursor-pointer mb-2"
                        onClick={() => onSelectServer(server.id)}
                        onContextMenu={(e) => handleContextMenu(e, server.id)}
                        title={server.name}
                    >
                        {/* Active Indicator */}
                        <div className={`absolute left-[-4px] w-2 bg-white rounded-r-lg transition-all duration-200 ${activeServerId === server.id ? 'h-10' : 'h-0 group-hover:h-5'
                            }`} />

                        <div
                            className={`relative w-12 h-12 transition-all duration-200 flex items-center justify-center text-white text-lg font-semibold ${activeServerId === server.id ? 'rounded-[16px]' : 'rounded-[24px] group-hover:rounded-[16px]'
                                }`}
                        >
                            <div
                                className={`w-full h-full absolute inset-0 transition-opacity duration-300 ${activeServerId === server.id ? 'rounded-[16px]' : 'rounded-[24px] group-hover:rounded-[16px]'
                                    } ${connectionStates && !state?.isOnline ? 'grayscale opacity-20' : ''}`}
                                style={{
                                    backgroundImage: `url(${new URL(server.url + "/public/server_logo.webp").toString()}), url(${new URL(server.url + "/logo.webp").toString()})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}
                            />

                            {/* Unread Badge */}
                            {state && state.unreadCount > 0 && (
                                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full border-[3px] border-[#1E1F22] z-10 pointer-events-none shadow-md
                                          min-w-[20px] h-[20px] flex items-center justify-center leading-none">
                                    {state.unreadCount > 99 ? '99+' : state.unreadCount}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            <div
                className="w-12 h-12 bg-[#313338] rounded-[24px] flex items-center justify-center cursor-pointer hover:rounded-[16px] hover:bg-[#23A559] transition-all duration-200 group mt-1"
                onClick={onAddServer}
                title="Add a Server"
            >
                <span className="text-[#23A559] group-hover:text-white text-2xl mb-1">+</span>
            </div>

            {contextMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setContextMenu(null)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu(null);
                        }}
                    />
                    <div
                        className="fixed bg-[#111214] border border-[#1E1F22] rounded shadow-lg py-2 w-48 z-50 text-[#DBDEE1] text-sm font-medium"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to window and closing menu
                    >
                        <div className="px-2 py-0.5">
                            <button
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white transition-colors"
                                onClick={() => {
                                    if (onMarkAsRead) onMarkAsRead(contextMenu.serverId);
                                    setContextMenu(null);
                                }}
                            >
                                Mark All as Read
                            </button>
                        </div>
                        <div className="px-2 py-0.5">
                            <button
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-[#5865F2] hover:text-white transition-colors"
                                onClick={() => {
                                    if (onEditServer) onEditServer(contextMenu.serverId);
                                    setContextMenu(null);
                                }}
                            >
                                Edit Server Settings
                            </button>
                        </div>
                        <div className="my-1 border-t border-[#2B2D31] mx-2"></div>
                        <div className="px-2 py-0.5">
                            <button
                                className="w-full text-left px-2 py-1.5 rounded text-[#DA373C] hover:bg-[#DA373C] hover:text-white transition-colors"
                                onClick={() => {
                                    if (onDeleteServer) onDeleteServer(contextMenu.serverId);
                                    setContextMenu(null);
                                }}
                            >
                                Delete Server
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Sidebar;
