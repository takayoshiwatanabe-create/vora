import { supabase } from "@/lib/supabase";
import { KanbanCardSuggestion } from "@/types/kanban";
import { t } from "@/i18n";

interface AiProcessAudioResponse {
  suggestion: KanbanCardSuggestion | null;
  confidence: number;
  message?: string;
}

/**
 * Processes an audio blob using an Edge Function to transcribe and categorize it.
 * @param audioBlob The audio file as a Blob.
 * @param boardId Optional ID of the Kanban board for context.
 * @returns A promise that resolves to an AiProcessAudioResponse.
 */
export async function processAudioWithAI(
  audioBlob: Blob,
  boardId?: string
): Promise<AiProcessAudioResponse> {
  const session = (await supabase.auth.getSession()).data.session;
  const token = session?.access_token;

  if (!token) {
    throw new Error(t("auth.notAuthenticated"));
  }

  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm"); // Assuming webm format from recording
  if (boardId) {
    formData.append("boardId", boardId);
  }

  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/process-audio`, // Ensure this URL is correct for your Edge Function
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' is automatically set by fetch when using FormData
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = (await response.json()) as { message?: string };
      throw new Error(
        errorData.message || t("api.ai.edgeFunctionError")
      );
    }

    const data: AiProcessAudioResponse = (await response.json()) as AiProcessAudioResponse;

    // The spec says "AIが自信を持てる時のみ自動実行。不確かな時はユーザーへ確認"
    // This implies that `data.suggestion` might be null or have a low confidence.
    // The client-side `AiSuggestionModal` will handle the `confidence` check.
    // So, we should not throw an error here if `data.suggestion` is null,
    // but rather return it as is, and let the client decide.
    // The current code throws if `data.suggestion` is null, which means the API *must* return a suggestion.
    // Let's align with the design spec which allows for null suggestion or low confidence.
    // The client will handle the `data.suggestion` being null by showing an error or specific UI.
    // So, removing the throw here.
    return data;
  } catch (error: unknown) {
    console.error("AI processing error:", error);
    throw new Error(
      (error as Error).message || t("api.ai.unknownError")
    );
  }
}
