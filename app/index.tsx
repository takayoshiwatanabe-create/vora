import { StyleSheet, Text, View } from "react-native";
import { t, isRTL } from "@/i18n";

export default function HomeScreen() {
  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Text style={[styles.title, isRTL && styles.rtlText]}>{t("home.title")}</Text>
      <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t("home.subtitle")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  rtlContainer: {
    // For RTL, if specific layout adjustments are needed beyond text alignment
    // For example, if elements need to be reversed in order or positioned differently.
    // For now, text alignment is handled by rtlText.
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 16,
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  rtlText: {
    textAlign: "right",
  },
});

