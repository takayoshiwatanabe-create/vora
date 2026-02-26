import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { User } from "@supabase/supabase-js";
import { t, isRTL } from "@/i18n";

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps): JSX.Element {
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName = user.user_metadata?.full_name as string | undefined || user.email;

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarPlaceholderText}>
            {displayName ? displayName[0]?.toUpperCase() : "?"}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={[styles.displayName, isRTL && styles.rtlText]}>
          {displayName}
        </Text>
        {user.email && (
          <Text style={[styles.email, isRTL && styles.rtlText]}>
            {user.email}
          </Text>
        )}
        <Text style={[styles.userId, isRTL && styles.rtlText]}>
          {t("settings.userIdDisplay", { id: user.id })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
  },
  rtlContainer: {
    flexDirection: "row-reverse", // Reverse for RTL
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarPlaceholderText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  userId: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
  },
  rtlText: {
    textAlign: "right",
  },
});

