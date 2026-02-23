import React, { useEffect, useState } from 'react';

interface Source {
    id: string;
    name: string;
    thumbnail: string;
    type: 'screen' | 'window';
}

interface Props {
    onClose: () => void;
}

export const ScreenPicker = ({ onClose }: Props) => {
    const [sources, setSources] = useState<Source[]>([]);
    const [tab, setTab] = useState<'screen' | 'window'>('screen');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        (window as any).electron.screen.getSources().then(setSources);
    }, []);

    const handleShare = () => {
        if (selectedId) {
            (window as any).electron.screen.selectSource(selectedId);
            onClose();
        }
    };

    const handleCancel = () => {
        (window as any).electron.screen.selectSource('cancel');
        onClose();
    };

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
        >
            {/* Modal */}
            <div className="flex flex-col w-[640px] max-h-[520px] bg-[#313338] text-white rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <h1 className="text-lg font-bold">Share your screen</h1>
                    <button onClick={handleCancel} className="text-gray-400 hover:text-white transition text-xl leading-none">&times;</button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-white/10 px-6">
                    {['screen', 'window'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t as any)}
                            className={`pb-2 capitalize text-sm transition ${tab === t ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            {t === 'screen' ? 'Screens' : 'Applications'}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 p-4 scrollbar-thin scrollbar-thumb-gray-600">
                    {sources.filter(s => s.type === tab).map((source) => (
                        <div
                            key={source.id}
                            onClick={() => setSelectedId(source.id)}
                            className={`group cursor-pointer rounded-lg p-2 transition ${selectedId === source.id ? 'bg-indigo-500/20 ring-2 ring-indigo-500' : 'hover:bg-white/5'}`}
                        >
                            <div className="relative aspect-video rounded overflow-hidden bg-black mb-2 border border-white/5">
                                <img src={source.thumbnail} className="w-full h-full object-contain" alt={source.name} />
                            </div>
                            <p className="text-sm truncate font-medium text-gray-300 group-hover:text-white">
                                {source.name}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!selectedId}
                        onClick={handleShare}
                        className="px-8 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition"
                    >
                        Go Live
                    </button>
                </div>
            </div>
        </div>
    );
};