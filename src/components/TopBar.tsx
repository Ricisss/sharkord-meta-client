import React from 'react';

const TopBar = ({ serverName = "Sharkord Official" }) => {
    const handleMinimize = () => {
        (window as any).electron.window.minimize();
    };

    const handleMaximize = () => {
        (window as any).electron.window.maximize();
    };

    const handleClose = () => {
        (window as any).electron.window.close();
    };

    return (
        <div
            className="h-12 bg-[#313338] border-b border-[#1E1F22] flex items-center px-4 shadow-sm flex-shrink-0 justify-between select-none text-center"
            style={{ WebkitAppRegion: 'drag' } as any}
        >
            <div className="flex-1 overflow-hidden">
                <h1 className="text-[#B5BAC1] font-bold text-sm truncate">{serverName}</h1>
            </div>

            <div className="flex items-center no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
                <button
                    onClick={handleMinimize}
                    className="w-8 h-8 flex items-center justify-center text-[#B5BAC1] hover:bg-[#3F4147] hover:text-white transition-colors"
                >
                    <span className="text-lg">−</span>
                </button>
                <button
                    onClick={handleMaximize}
                    className="w-8 h-8 flex items-center justify-center text-[#B5BAC1] hover:bg-[#3F4147] hover:text-white transition-colors"
                >
                    <span className="text-base">▢</span>
                </button>
                <button
                    onClick={handleClose}
                    className="w-8 h-8 flex items-center justify-center text-[#B5BAC1] hover:bg-[#ED4245] hover:text-white transition-colors"
                >
                    <span className="text-lg">✕</span>
                </button>
            </div>
        </div>
    );
};

export default TopBar;
