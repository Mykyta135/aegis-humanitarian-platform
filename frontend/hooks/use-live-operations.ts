"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface LiveLocation {
    userId: string;
    location: { lat: number; lng: number };
    taskId?: string;
}

// The hook now takes a callback function as an argument
export const useLiveOperations = (
    onLocationUpdate: (payload: LiveLocation) => void
) => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000");

        socket.on("connect", () => {
            console.log(
                "%c✅ WebSocket Connected!",
                "color: green; font-weight: bold;"
            );
            setIsConnected(true);
        });

        // When we receive an event, we call the callback function from the parent component
        socket.on("locationUpdate", (payload: LiveLocation) => {
            console.log(
                `%c🔔 Event Received: 'locationUpdate'`,
                "color: blue; font-weight: bold;"
            );
            console.log("Payload:", payload);
            onLocationUpdate(payload); // <-- CALL THE CALLBACK
        });

        socket.on("disconnect", () => {
            console.log(
                "%c❌ WebSocket Disconnected!",
                "color: red; font-weight: bold;"
            );
            setIsConnected(false);
        });

        socket.on("connect_error", (err) => {
            console.error("WebSocket Connection Error:", err.message);
        });

        return () => {
            socket.disconnect();
        };
    }, [onLocationUpdate]); // Add callback to dependency array

    return { isConnected };
};
