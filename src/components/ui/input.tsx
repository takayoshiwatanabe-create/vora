import React from "react";
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  View,
  Text,
} from "react-native";
import { isRTL } from "@/i18n";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps): JSX.Element {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, isRTL && styles.rtlText]} accessibilityLabel={label}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          isRTL && styles.rtlInput,
          error ? styles.inputError : {},
          style,
        ]}
        placeholderTextColor="#999"
        accessibilityLabel={props.accessibilityLabel || label || props.placeholder} // Fallback to placeholder if label not provided
        accessibilityState={{ disabled: props.editable === false }}
        accessibilityErrorMessage={error} // Provide error message for screen readers
        aria-invalid={!!error} // Indicate invalid state for web accessibility
        {...props}
      />
      {error && (
        <Text style={[styles.errorText, isRTL && styles.rtlText]} accessibilityLiveRegion="assertive">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    fontWeight: "500",
  },
  rtlText: {
    textAlign: "right",
  },
  input: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#333",
    minHeight: 50, // Ensure minimum height for accessibility
  },
  rtlInput: {
    textAlign: "right",
  },
  inputError: {
    borderColor: "#dc3545", // Red for error state
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 5,
  },
});
