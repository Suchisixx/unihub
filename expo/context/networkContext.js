import { createContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const online = state.isConnected && state.isInternetReachable;
            setIsOnline(online);
        });
        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <NetworkContext.Provider value={{ isOnline }}>
            {children}
        </NetworkContext.Provider>
    );
}
