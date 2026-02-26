import { Stack } from "expo-router";
import { t } from "@/i18n";

export default function MainLayout(): JSX.Element {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: t("home.title"), headerShown: false }}
      />
      <Stack.Screen
        name="kanban/index"
        options={{ title: t("kanban.boardsTitle") }}
      />
      <Stack.Screen
        name="kanban/[boardId]"
        options={{ title: t("kanban.boardDetailTitle") }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: t("settings.title") }}
      />
    </Stack>
  );
}



