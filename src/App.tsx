import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MainArea from './components/MainArea';
import ServerModal from './components/ServerModal';
import { ScreenPicker } from './components/ScreenSelector';
import "./index.css";
import type { ServerData } from './interfaces/ServerData';
import { useServerConnections } from './hooks/useServerConnections';



function App() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServerId, setEditingServerId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showScreenPicker, setShowScreenPicker] = useState(false);

  const { connectionStates, markAsRead } = useServerConnections(servers, activeServerId);

  // Listen for the main process requesting a screen share source
  useEffect(() => {
    const showPicker = () => setShowScreenPicker(true);
    (window as any).electron.screen.onShowPicker(showPicker);
    return () => (window as any).electron.screen.offShowPicker(showPicker);
  }, []);

  // Load servers from Electron Store via IPC
  useEffect(() => {
    const loadServers = async () => {
      try {
        const saved: ServerData[] = await (window as any).electron.servers.get();

        if (saved && saved.length > 0) {
          setServers(saved);
          setActiveServerId(saved[0]?.id || null);
        }
      } catch (e) {
        console.error("Failed to load servers via IPC", e);
      } finally {
        setHasLoaded(true);
      }
    };
    loadServers();
  }, []);

  // Save servers to Electron Store via IPC
  useEffect(() => {
    if (!hasLoaded) return;

    const saveServers = async () => {
      try {
        await (window as any).electron.servers.save(servers);
      } catch (e) {
        console.error("Failed to save servers via IPC", e);
      }
    };

    saveServers();
  }, [servers, hasLoaded]);

  const handleAddServer = (data: { name: string; url: string; identity: string; password?: string }) => {
    const newServer: ServerData = {
      id: crypto.randomUUID(),
      name: data.name,
      url: data.url.replace(/\/$/, ""),
      identity: data.identity,
      password: data.password ?? "",
    };

    const updatedServers = [...servers, newServer];
    setServers(updatedServers);
    setActiveServerId(newServer.id);
  };

  const handleDeleteServer = (id: string) => {
    const updatedServers = servers.filter(s => s.id !== id);
    setServers(updatedServers);

    // Auto-switch away from deleted server if it was active
    if (activeServerId === id) {
      if (updatedServers.length > 0) {
        // Fallback to null if updatedServers[0] is somehow undefined despite length check
        setActiveServerId(updatedServers[0]?.id || null);
      } else {
        setActiveServerId(null);
      }
    }
  };

  const handleEditServer = (id: string) => {
    const serverToEdit = servers.find(s => s.id === id);
    if (serverToEdit) {
      setEditingServerId(id);
      setIsModalOpen(true);
    }
  };

  const handleSaveServer = (data: { name: string; url: string; identity: string; password?: string }) => {
    if (editingServerId) {
      // Edit mode
      setServers((prev) =>
        prev.map(s => s.id === editingServerId ? {
          ...s,
          name: data.name,
          url: data.url.replace(/\/$/, ""),
          identity: data.identity,
          password: data.password || ""
        } : s)
      );
    } else {
      // Add mode
      handleAddServer(data);
    }
  };

  const activeServer = servers.find(s => s.id === activeServerId);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans bg-[oklch(0.205_0_0)]">
      <TopBar serverName={activeServer?.name || "No Server Selected"} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          servers={servers}
          activeServerId={activeServerId}
          onSelectServer={setActiveServerId}
          onAddServer={() => {
            setEditingServerId(null);
            setIsModalOpen(true);
          }}
          onDeleteServer={handleDeleteServer}
          onEditServer={handleEditServer}
          connectionStates={connectionStates}
          onMarkAsRead={markAsRead}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {servers.length > 0 ? (
            <MainArea servers={servers} activeServerId={activeServerId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#313338] text-[#B5BAC1]">
              <p className="text-lg">Select a server or add a new one to get started.</p>
              <button
                onClick={() => {
                  setEditingServerId(null);
                  setIsModalOpen(true);
                }}
                className="mt-6 bg-[#5865F2] text-white px-6 py-2 rounded hover:bg-[#4752C4] transition-colors"
              >
                Add Server
              </button>
            </div>
          )}
        </div>
      </div>

      <ServerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingServerId(null);
        }}
        onSubmit={handleSaveServer}
        server={servers.find(s => s.id === editingServerId) || null}
      />

      {showScreenPicker && (
        <ScreenPicker onClose={() => setShowScreenPicker(false)} />
      )}
    </div>

  );
}

export default App;
