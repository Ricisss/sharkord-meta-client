import React, { useRef } from 'react';
import { getInjectionScript } from '../scripts/injection';
import type { ServerData } from '../interfaces/ServerData';

interface MainAreaProps {
    servers: ServerData[];
    activeServerId: string | null;
}

const MainArea: React.FC<MainAreaProps> = ({ servers, activeServerId }) => {
    const webviewRefs = useRef<{ [key: string]: any }>({});

    const injectExample = (serverId: string) => {
        const server = servers.find(s => s.id === serverId);
        const webview = webviewRefs.current[serverId];

        if (server && webview) {
            console.log(`Injecting script into ${server.name} with identity: ${server.identity}`);
            webview.executeJavaScript(getInjectionScript(server));
        }

    };

    return (
        <div className="flex-1 relative w-full h-full bg-[oklch(0.145, 0, 0)] min-h-0 min-w-0">
            {servers.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#B5BAC1]">
                    <p className="text-lg">Add a server to get started.</p>
                </div>
            )}

            {servers.map((server) => {
                const isActive = activeServerId === server.id;
                return (
                    <div
                        key={server.id}
                        className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${isActive ? 'opacity-100 z-10 visible' : 'opacity-0 z-0 invisible pointer-events-none'
                            }`}
                        style={{ display: isActive ? 'flex' : 'none' }}
                    >
                        <webview
                            ref={(el: any) => {
                                if (el) {
                                    webviewRefs.current[server.id] = el;
                                    // Automatically inject script when page loads
                                    const handleDomReady = () => {
                                        el.executeJavaScript(getInjectionScript(server));
                                    };

                                    // Remove old listener if it exists (to avoid duplicates if ref is called again)
                                    el.removeEventListener('dom-ready', el._domReadyHandler);
                                    el._domReadyHandler = handleDomReady;
                                    el.addEventListener('dom-ready', handleDomReady);
                                }
                            }}
                            src={server.url}
                            className="flex-1 w-full h-full border-none"
                            title={server.name}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default MainArea;
