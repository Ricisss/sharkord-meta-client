export interface IElectronAPI {
    ipcRenderer: {
        send: (channel: string, data?: any) => void;
        invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
}

declare global {
    interface Window {
        electron: IElectronAPI;
    }
}
