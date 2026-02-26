import { Stack } from "expo-router";
import { t } from "@/i18n";

export default function AuthLayout(): JSX.Element {
  return (
    <Stack>
      <Stack.Screen
        name="sign-in"
        options={{ title: t("auth.signInTitle"), headerShown: false }}
      />
      <Stack.Screen
        name="sign-up"
        options={{ title: t("auth.signUpTitle"), headerShown: false }}
      />
    </Stack>
  );
}


