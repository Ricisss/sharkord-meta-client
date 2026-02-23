import React, { useEffect, useState } from 'react';
import type { ServerData } from '../interfaces/ServerData';

interface ServerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; url: string; identity: string; password?: string; }) => void;
    server?: ServerData | null;
}

const ServerModal: React.FC<ServerModalProps> = ({ isOpen, onClose, onSubmit, server }) => {
    const isEditing = !!server;
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [identity, setIdentity] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (server) {
                setName(server.name);
                setUrl(server.url);
                setIdentity(server.identity);
                setPassword(server.password || '');
            } else {
                setName('');
                setUrl('');
                setIdentity('');
                setPassword('');
            }
            setError(null);
        }
    }, [server, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            console.log('Checking server URL:', url);
            const checkUrl = url.replace(/\/$/, "");
            const response = await fetch(checkUrl);

            if (response.ok) {
                console.log('Successfully connected to:', checkUrl);
                onSubmit({ name, url: checkUrl, identity, password });
                onClose();
            } else {
                setError(`Server returned status: ${response.status}`);
            }
        } catch (err: any) {
            console.error('Error checking server URL:', err);
            setError(`Failed to connect to server: ${err.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-[440px] bg-[#313338] rounded-md shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white text-center mb-2">
                        {isEditing ? 'Server Settings' : 'Add new server'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#B5BAC1] uppercase mb-2">Server Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full bg-[#1E1F22] text-[#DBDEE1] rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
                                placeholder="Server name"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded p-2 text-xs text-red-400">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-[#B5BAC1] uppercase mb-2">Server URL</label>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                required
                                className="w-full bg-[#1E1F22] text-[#DBDEE1] rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
                                placeholder="https://demo.sharkord.com/"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#B5BAC1] uppercase mb-2">Identity</label>
                            <input
                                type="text"
                                value={identity}
                                onChange={(e) => setIdentity(e.target.value)}
                                required
                                className="w-full bg-[#1E1F22] text-[#DBDEE1] rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
                                placeholder="Guest"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#B5BAC1] uppercase mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-[#1E1F22] text-[#DBDEE1] rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-white text-sm hover:underline"
                            >
                                {isEditing ? 'Cancel' : 'Back'}
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`bg-[#5865F2] text-white px-7 py-2.5 rounded font-medium transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#4752C4]'}`}
                            >
                                {isLoading
                                    ? (isEditing ? 'Saving...' : 'Checking...')
                                    : (isEditing ? 'Save' : 'Create')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ServerModal;
