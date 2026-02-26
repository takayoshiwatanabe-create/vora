import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from "react-native";
import { isRTL } from "@/i18n";

interface ButtonProps {
  onPress: (event: GestureResponderEvent) => void;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({
  onPress,
  title,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "default",
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps): JSX.Element {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    disabled || loading ? styles.disabled : {},
    style,
  ];

  const buttonTextStyles = [
    styles.textBase,
    styles[`${variant}Text`],
    isRTL && styles.rtlText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading }} // Reflect disabled state for accessibility
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#fff" : "#007bff"}
          accessibilityLabel={title + " " + "Loading"} // Provide context for loading indicator
        />
      ) : (
        <Text style={buttonTextStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row", // For icon buttons or loading indicator
  },
  textBase: {
    fontWeight: "bold",
  },
  rtlText: {
    textAlign: "right",
  },

  // Variants
  primary: {
    backgroundColor: "#007bff", // Blue
  },
  primaryText: {
    color: "#fff",
  },
  secondary: {
    backgroundColor: "#e0e0e0", // Light gray
    borderColor: "#ccc",
    borderWidth: 1,
  },
  secondaryText: {
    color: "#333",
  },
  destructive: {
    backgroundColor: "#dc3545", // Red
  },
  destructiveText: {
    color: "#fff",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  ghostText: {
    color: "#007bff",
  },

  // Sizes
  default: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 100,
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    minWidth: 80,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 25,
    minWidth: 120,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22, // Circular for icon
  },

  disabled: {
    opacity: 0.6,
  },
});
