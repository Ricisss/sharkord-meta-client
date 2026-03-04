import React, { useEffect, useState } from 'react';
import type { ServerData } from '../interfaces/ServerData';

interface ServerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; url: string; port: string; identity: string; password: string; }) => void;
    server?: ServerData | null;
}

const ServerModal: React.FC<ServerModalProps> = ({ isOpen, onClose, onSubmit, server }) => {
    const isEditing = !!server;
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [port, setPort] = useState('');
    const [identity, setIdentity] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (server) {
                setName(server.name);
                setUrl(server.url);
                setPort(server.port || '');
                setIdentity(server.identity);
                setPassword(server.password || '');
            } else {
                setName('');
                setUrl('');
                setPort('');
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
                onSubmit({ name, url: checkUrl, port, identity, password });
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
                                className="w-full bg-[#1E1F22] text-[#DBDEE1] placeholder:text-[#DBDEE1]/30 rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
                                placeholder="Server name"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded p-2 text-xs text-red-400">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <div className="flex-[3]">
                                <label className="block text-xs font-bold text-[#B5BAC1] uppercase mb-2">URL</label>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    required
                                    className="w-full bg-[#1E1F22] text-[#DBDEE1] placeholder:text-[#DBDEE1]/20 rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
                                    placeholder="https://demo.sharkord.com"
                                />
                            </div>
                            <div className="flex-1 opacity-50 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                                <div className="flex items-center gap-1 mb-2">
                                    <label className="block text-xs font-bold text-[#B5BAC1] uppercase">PORT</label>
                                    <div className="group relative">
                                        <div className="w-3.5 h-3.5 rounded-full bg-[#B5BAC1] text-[#313338] flex items-center justify-center text-[10px] font-bold cursor-help">?</div>
                                        <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-[#111214] text-white text-[10px] p-3 rounded shadow-xl border border-[#1E1F22] z-10 font-normal normal-case pointer-events-none leading-relaxed">
                                            <p className="font-bold mb-1">Optional Server Port</p>
                                            <p>Unless you are connecting to localhost, you probably want to leave this empty!</p>
                                            <p>If you are connecting to localhost, the default server port is <span className="text-[#5865F2]">4991</span>.</p>
                                        </div>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={port}
                                    onChange={(e) => setPort(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-[#1E1F22] text-[#DBDEE1] placeholder:text-[#DBDEE1]/20 rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
                                    placeholder="4991"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#B5BAC1] uppercase mb-2">Identity</label>
                            <input
                                type="text"
                                value={identity}
                                onChange={(e) => setIdentity(e.target.value)}
                                required
                                className="w-full bg-[#1E1F22] text-[#DBDEE1] placeholder:text-[#DBDEE1]/30 rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
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
                                className="w-full bg-[#1E1F22] text-[#DBDEE1] placeholder:text-[#DBDEE1]/30 rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-[#5865F2] transition-all"
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
