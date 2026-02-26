import { supabase } from "@/lib/supabase";
import { KanbanCard } from "@/src/types/kanban"; // Assuming KanbanCard type is defined here
import { t } from "@/i18n";

interface CreateKanbanCardResponse {
  card?: KanbanCard;
  error?: string;
}

/**
 * Sends base64 encoded audio to an Edge Function for Whisper transcription
 * and subsequent Kanban card creation.
 *
 * @param base64Audio The base64 encoded audio string.
 * @param accessToken The Supabase access token for authentication.
 * @param boardId Optional board ID to associate the card with.
 * @returns A promise that resolves to the created KanbanCard or null if an error occurs.
 */
export async function createKanbanCard(
  base64Audio: string,
  accessToken: string,
  boardId?: string
): Promise<KanbanCard | null> {
  try {
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/process-voice-input`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ audio: base64Audio, boardId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Edge Function error:", errorData);
      throw new Error(
        errorData.message || t("api.ai.edgeFunctionError")
      );
    }

    const data: CreateKanbanCardResponse = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.card) {
      throw new Error(t("api.ai.noCardReturned"));
    }

    return data.card;
  } catch (error: unknown) {
    console.error("Error in createKanbanCard:", error);
    throw new Error(
      (error as Error).message || t("api.ai.unknownError")
    );
  }
}
