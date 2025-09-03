import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { User } from "@/lib/auth";

export interface Message {
  id: number;
  content: string;
  sender_id: number;
  conversation_id: number;
  createdAt: string;
  imagePath?: string;
  isRead: boolean;
}

export const useMessages = (
  conversation_id: number | null,
  currentUser?: User
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!conversation_id) return;

    try {
      setError(null);
      setIsLoading(true);

      const response = await api.get(`/messages/${conversation_id}`);
      const data = response.data;
      console.log("Fetched messages:", data);

      const transformedMessages: Message[] = data.map((msg: any) => ({
        id: msg.message_id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.message ? msg.message.replace(/"/g, "") : "",
        createdAt: msg.created_at,
        imagePath: msg.image
          ? `/imgs/${msg.image.replace(/\\/g, "/")}`
          : undefined,
        isRead: true,
      }));

      setMessages(transformedMessages);
      setIsLoading(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch messages";
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [conversation_id]);

  const sendMessage = async (content?: string, image?: File) => {
    if (!conversation_id || (!content && !image)) return;

    // Create optimistic message immediately for better UX
    const optimisticId = Date.now();
    const optimisticMessage: Message = {
      id: optimisticId,
      content: content || "",
      sender_id: currentUser?.id || 1, // Use current user ID
      conversation_id: conversation_id,
      createdAt: new Date().toISOString(),
      imagePath: image ? URL.createObjectURL(image) : undefined,
      isRead: true,
    };

    console.log("Creating optimistic message:", optimisticMessage);
    console.log("Current user:", currentUser);

    // Add optimistic message to UI immediately
    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

    try {
      const formData = new FormData();

      if (content) {
        formData.append("content", content);
      }

      if (image) {
        formData.append("image", image);
      }

      const response = await api.post(
        `/messages/${conversation_id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const newMessage = response.data;
      console.log("Message sent successfully:", newMessage);

      // Replace optimistic message with real message from server
      const realMessage: Message = {
        id: newMessage.message_id || newMessage.id,
        content: newMessage.content || content || "",
        sender_id: newMessage.sender_id,
        conversation_id: newMessage.conversation_id || conversation_id,
        createdAt:
          newMessage.created_at ||
          newMessage.createdAt ||
          new Date().toISOString(),
        imagePath: newMessage.image
          ? `/imgs/${newMessage.image.replace(/\\/g, "/")}`
          : image
          ? URL.createObjectURL(image)
          : undefined,
        isRead: true,
      };

      // Replace the optimistic message with the real one
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.id === optimisticId ? realMessage : msg))
      );

      return newMessage;
    } catch (error) {
      console.error("Error sending message:", error);

      // Remove the optimistic message if sending failed
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== optimisticId)
      );

      setError(
        error instanceof Error ? error.message : "Failed to send message"
      );
      throw error;
    }
  };

  // Initial fetch when conversation changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    refetch: fetchMessages,
  };
};
