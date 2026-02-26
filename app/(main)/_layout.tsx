import { Stack } from "expo-router";
import { t } from "@/i18n";

export default function MainLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: t("home.title") }}
      />
      <Stack.Screen
        name="kanban/index"
        options={{ title: t("kanban.boardListTitle") }}
      />
      <Stack.Screen
        name="kanban/[boardId]"
        options={{ title: t("kanban.boardDetailTitle"), headerBackTitle: t("common.back") }}
      />
      {/* Add other main screens here */}
    </Stack>
  );
}
