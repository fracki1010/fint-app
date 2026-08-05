import { useEffect, useState, useRef } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setWasOffline(false);
        // Show reconnected state briefly, then dismiss
        reconnectTimer.current = setTimeout(() => {
          setWasOffline(false);
        }, 3000);
      }
    };

    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [wasOffline]);

  // "reconnected" is true for 3 seconds after coming back online
  const justReconnected = !isOnline ? false : reconnectTimer.current !== undefined && wasOffline === false;

  return { isOnline, wasOffline: !isOnline, justReconnected };
}

export default function OfflineIndicator() {
  const { isOnline, justReconnected } = useOnlineStatus();

  if (isOnline && !justReconnected) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[80] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold safe-bottom transition-all duration-300 ${
        justReconnected
          ? "bg-success/90 text-white"
          : "bg-warning/90 text-warning-foreground"
      }`}
    >
      {justReconnected ? (
        <>
          <Wifi size={14} />
          Conexión restablecida
        </>
      ) : (
        <>
          <WifiOff size={14} />
          Sin conexión — los datos nuevos no se guardarán
        </>
      )}
    </div>
  );
}
