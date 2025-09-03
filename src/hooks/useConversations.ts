"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { User } from "@/lib/auth";

export interface Conversation {
  id: number;
  conversation_id: number;
  other_user_name: string;
  message_id: number | null;
  last_message: string;
  last_message_time: string;
  unreadCount?: number;
  participants: User[];
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await api.get("/conversations/friends");
      const data = response.data;
      console.log("Raw API data:", data);

      const transformedConversations: Conversation[] = data.map(
        (conv: any) => ({
          id: conv.conversation_id,
          conversation_id: conv.conversation_id,
          other_user_name: conv.other_user_name || "Unknown User",
          message_id: conv.message_id,
          last_message: conv.last_message
            ? conv.last_message.replace(/"/g, "")
            : "",
          last_message_time: conv.last_message_time || new Date().toISOString(),
          unreadCount: 0,
          participants: [
            {
              id: conv.other_user_id || 0,
              name: conv.other_user_name || "Unknown User",
            },
          ],
        })
      );

      console.log("Transformed conversations:", transformedConversations);
      setConversations(transformedConversations);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch conversations";
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  const createConversation = async (participantId: number) => {
    try {
      const response = await api.post("/conversations", {
        participantId,
      });

      const newConversation = response.data;
      console.log("Created conversation:", newConversation);

      // Refresh conversations after creating
      await fetchConversations();

      return newConversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create conversation"
      );
      throw error;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    createConversation,
    refetch: fetchConversations,
  };
};
