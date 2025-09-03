"use client";

import React, { ReactNode } from "react";

export interface WebSocketMessage {
  type: string;
  data: any;
}

interface WebSocketContextType {
  socket: null;
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  connect: () => void;
  disconnect: () => void;
  addMessageListener: (
    listener: (message: WebSocketMessage) => void
  ) => () => void;
}

// Simple mock context - no WebSocket functionality
const mockContext: WebSocketContextType = {
  socket: null,
  isConnected: true, // Always return true since we're using HTTP
  sendMessage: () => {
    console.log("� WebSocket disabled - using HTTP instead");
  },
  connect: () => {
    console.log("🔌 WebSocket disabled - using HTTP instead");
  },
  disconnect: () => {
    console.log("� WebSocket disabled - using HTTP instead");
  },
  addMessageListener: () => {
    console.log("👂 WebSocket disabled - using HTTP instead");
    return () => {}; // Return empty cleanup function
  },
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  // No WebSocket logic, just render children
  return <>{children}</>;
};

export const useWebSocketContext = () => {
  return mockContext;
};
