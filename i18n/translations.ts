export type Language = "ja" | "en" | "zh" | "ko" | "es" | "fr" | "de" | "pt" | "ar" | "hi";

export const translations: Record<Language, Record<string, string>> = {
  ja: {
    "home.title": "Vora (ヴォラ)",
    "home.subtitle": "思考を妨げる『入力・整理』という作業をこの世から消し去る",
  },
  en: {
    "home.title": "Vora",
    "home.subtitle": "Eliminating the 'input and organize' tasks that hinder thought",
  },
  zh: {
    "home.title": "Vora (沃拉)",
    "home.subtitle": "消除阻碍思考的“输入与整理”工作",
  },
  ko: {
    "home.title": "Vora (보라)",
    "home.subtitle": "사고를 방해하는 '입력 및 정리' 작업을 세상에서 없애다",
  },
  es: {
    "home.title": "Vora",
    "home.subtitle": "Eliminando las tareas de 'entrada y organización' que obstaculizan el pensamiento",
  },
  fr: {
    "home.title": "Vora",
    "home.subtitle": "Éliminer les tâches 'saisie et organisation' qui entravent la pensée",
  },
  de: {
    "home.title": "Vora",
    "home.subtitle": "Beseitigung der 'Eingabe- und Organisations'-Aufgaben, die das Denken behindern",
  },
  pt: {
    "home.title": "Vora",
    "home.subtitle": "Eliminando as tarefas de 'entrada e organização' que dificultam o pensamento",
  },
  ar: {
    "home.title": "فورا",
    "home.subtitle": "القضاء على مهام 'الإدخال والتنظيم' التي تعيق التفكير",
  },
  hi: {
    "home.title": "वोरा",
    "home.subtitle": "विचारों में बाधा डालने वाले 'इनपुट और व्यवस्थित' कार्यों को समाप्त करना",
  },
};

