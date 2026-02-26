import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { t, isRTL } from "@/i18n";
import { KanbanCardSuggestion } from "@/types/kanban";

interface AiSuggestionModalProps {
  isVisible: boolean;
  suggestion: KanbanCardSuggestion | null;
  loading: boolean;
  error: string | null;
  onConfirm: (confirmedSuggestion: KanbanCardSuggestion) => void;
  onCancel: () => void;
  onEdit: (field: keyof KanbanCardSuggestion, value: string | null) => void; // Allow null for optional fields
}

export function AiSuggestionModal({
  isVisible,
  suggestion,
  loading,
  error,
  onConfirm,
  onCancel,
  onEdit,
}: AiSuggestionModalProps): JSX.Element {
  if (!isVisible) {
    return <></>;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onCancel}
      accessibilityViewIsModal={true} // Indicate that this view is a modal for screen readers
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, isRTL && styles.rtlModalView]}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" accessibilityLabel={t("voiceInput.processingAudio")} />
              <Text style={[styles.loadingText, isRTL && styles.rtlText]}>
                {t("voiceInput.processingAudio")}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, isRTL && styles.rtlText]} accessibilityLiveRegion="assertive">
                {t("common.error")}: {error}
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
              >
                <Text style={styles.buttonText}>{t("common.close")}</Text>
              </TouchableOpacity>
            </View>
          ) : suggestion ? (
            <ScrollView style={styles.scrollView} accessibilityLabel={t("aiSuggestion.modalContentLabel")}>
              <Text style={[styles.modalTitle, isRTL && styles.rtlText]} accessibilityRole="header">
                {t("aiSuggestion.title")}
              </Text>

              <View style={styles.suggestionItem}>
                <Text style={[styles.label, isRTL && styles.rtlText]}>
                  {t("aiSuggestion.cardTextLabel")}
                </Text>
                <TextInput
                  style={[styles.input, isRTL && styles.rtlInput]}
                  value={suggestion.cardText}
                  onChangeText={(text) => onEdit("cardText", text)}
                  multiline
                  accessibilityLabel={t("aiSuggestion.cardTextLabel")}
                  accessibilityHint={t("aiSuggestion.cardTextHint")}
                />
              </View>

              <View style={styles.suggestionItem}>
                <Text style={[styles.label, isRTL && styles.rtlText]}>
                  {t("aiSuggestion.projectLabel")}
                </Text>
                <TextInput
                  style={[styles.input, isRTL && styles.rtlInput]}
                  value={suggestion.project || ""}
                  onChangeText={(text) => onEdit("project", text || null)} // Pass null if empty
                  accessibilityLabel={t("aiSuggestion.projectLabel")}
                  accessibilityHint={t("aiSuggestion.projectHint")}
                />
              </View>

              <View style={styles.suggestionItem}>
                <Text style={[styles.label, isRTL && styles.rtlText]}>
                  {t("aiSuggestion.priorityLabel")}
                </Text>
                <TextInput
                  style={[styles.input, isRTL && styles.rtlInput]}
                  value={suggestion.priority || ""}
                  onChangeText={(text) => onEdit("priority", text === "" ? null : (text as "low" | "medium" | "high"))} // Pass null if empty
                  accessibilityLabel={t("aiSuggestion.priorityLabel")}
                  accessibilityHint={t("aiSuggestion.priorityHint")}
                />
              </View>

              <View style={styles.suggestionItem}>
                <Text style={[styles.label, isRTL && styles.rtlText]}>
                  {t("aiSuggestion.dueDateLabel")}
                </Text>
                <TextInput
                  style={[styles.input, isRTL && styles.rtlInput]}
                  value={suggestion.dueDate || ""}
                  onChangeText={(text) => onEdit("dueDate", text || null)} // Pass null if empty
                  placeholder={t("aiSuggestion.dueDatePlaceholder")}
                  accessibilityLabel={t("aiSuggestion.dueDateLabel")}
                  accessibilityHint={t("aiSuggestion.dueDateHint")}
                />
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                  accessibilityRole="button"
                  accessibilityLabel={t("aiSuggestion.cancelButton")}
                >
                  <Text style={styles.buttonText}>{t("aiSuggestion.cancelButton")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={() => onConfirm(suggestion)}
                  accessibilityRole="button"
                  accessibilityLabel={t("aiSuggestion.confirmButton")}
                >
                  <Text style={styles.buttonText}>{t("aiSuggestion.confirmButton")}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, isRTL && styles.rtlText]} accessibilityLiveRegion="assertive">
                {t("api.ai.noCardReturned")}
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
              >
                <Text style={styles.buttonText}>{t("common.close")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
    maxHeight: "80%",
  },
  rtlModalView: {
    // Specific RTL layout adjustments if needed
  },
  scrollView: {
    width: "100%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  suggestionItem: {
    marginBottom: 15,
    width: "100%",
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  rtlInput: {
    textAlign: "right",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    width: "100%",
  },
  button: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#007bff",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
  rtlText: {
    textAlign: "right",
  },
});
