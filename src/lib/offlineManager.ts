import { useKanbanStore } from "@/stores/kanbanStore";
import { supabase } from "@/lib/supabase";
import { KanbanCard } from "@/types/kanban";
import { createKanbanCard, updateKanbanCard, deleteKanbanCard } from "@/api/kanban";
import { useAuthStore } from "@/stores/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { t } from "@/i18n";

// Define the structure for an offline change
interface OfflineKanbanChange {
  type: "insert" | "update" | "delete";
  data: KanbanCard;
  boardId: string; // Add boardId to the change object for easier processing
}

/**
 * Adds an offline Kanban card change to the Zustand store.
 * This change will be synchronized with Supabase when the network connection is restored.
 * @param boardId The ID of the board the change belongs to.
 * @param type The type of operation ('insert', 'update', 'delete').
 * @param data The KanbanCard object (or partial for update, or with ID for delete).
 */
export function addOfflineKanbanChange(
  boardId: string,
  type: "insert" | "update" | "delete",
  data: KanbanCard
): void {
  useKanbanStore.getState().addOfflineChange({ boardId, type, data });
  console.log("Offline change added:", { boardId, type, data });
}

/**
 * Synchronizes all pending offline Kanban changes with Supabase.
 * This function should be called when the network connection is restored.
 */
export async function syncOfflineChanges(): Promise<void> {
  const { offlineChanges, clearOfflineChanges } = useKanbanStore.getState();
  const session = useAuthStore.getState().session;
  const queryClient = useQueryClient();

  if (!session?.user?.id) {
    console.warn("Cannot sync offline changes: User not authenticated.");
    return;
  }

  if (offlineChanges.length === 0) {
    console.log("No offline changes to sync.");
    return;
  }

  console.log(`Attempting to sync ${offlineChanges.length} offline changes...`);

  const successfulChanges: OfflineKanbanChange[] = [];
  const failedChanges: OfflineKanbanChange[] = [];

  for (const change of offlineChanges) {
    try {
      switch (change.type) {
        case "insert": {
          // For inserts, the `data` contains the temporary client-generated ID.
          // We need to create a new card on the server.
          // The `createKanbanCard` function expects a `KanbanCardSuggestion` for `title`, `description`, etc.
          // We need to map `KanbanCard` to `KanbanCardSuggestion` for the API call.
          const suggestion: KanbanCardSuggestion = {
            cardText: change.data.title,
            project: change.data.description?.startsWith("Project: ") ? change.data.description.substring(9) : null,
            priority: change.data.priority,
            dueDate: change.data.due_date,
          };
          const { data, error } = await createKanbanCard(
            suggestion,
            change.boardId,
            session.user.id
          );
          if (error) {
            throw new Error(error.message);
          }
          if (data) {
            console.log("Synced insert:", data);
            // Invalidate queries for the specific board and general boards list
            void queryClient.invalidateQueries({ queryKey: ["kanbanCards", change.boardId] });
            void queryClient.invalidateQueries({ queryKey: ["kanbanBoards", session.user.id] });
          }
          break;
        }
        case "update": {
          const { data, error } = await updateKanbanCard(change.data.id, change.data);
          if (error) {
            throw new Error(error.message);
          }
          if (data) {
            console.log("Synced update:", data);
            void queryClient.invalidateQueries({ queryKey: ["kanbanCards", change.boardId] });
          }
          break;
        }
        case "delete": {
          const { success, error } = await deleteKanbanCard(change.data.id);
          if (error) {
            throw new Error(error.message);
          }
          if (success) {
            console.log("Synced delete:", change.data.id);
            void queryClient.invalidateQueries({ queryKey: ["kanbanCards", change.boardId] });
            void queryClient.invalidateQueries({ queryKey: ["kanbanBoards", session.user.id] }); // Invalidate boards query to update card_count
          }
          break;
        }
        default:
          console.warn("Unknown offline change type:", change.type);
          break;
      }
      successfulChanges.push(change);
    } catch (error: unknown) {
      console.error(`Failed to sync ${change.type} for card ${change.data.id}:`, error);
      failedChanges.push(change);
    }
  }

  // Clear only successful changes from the store
  clearOfflineChanges(successfulChanges);

  if (failedChanges.length > 0) {
    Alert.alert(
      t("offline.syncErrorTitle"),
      t("offline.syncErrorMessage", { count: failedChanges.length })
    );
  } else if (successfulChanges.length > 0) {
    Alert.alert(
      t("offline.syncSuccessTitle"),
      t("offline.syncSuccessMessage", { count: successfulChanges.length })
    );
  }
}
