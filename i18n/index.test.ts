import * as Localization from "expo-localization";
import { I18nManager } from "react-native";
import { translations } from "./translations"; // Import translations to verify keys

// Mock expo-localization
jest.mock("expo-localization", () => ({
  getLocales: jest.fn(),
}));

// Mock react-native I18nManager
jest.mock("react-native", () => ({
  I18nManager: {
    forceRTL: jest.fn(),
    allowRTL: jest.fn(),
    isRTL: false, // Default to false for testing
  },
}));

describe("i18n module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks to default LTR English
    (Localization.getLocales as jest.Mock).mockReturnValue([
      { languageCode: "en", textDirection: "ltr" },
    ]);
    // Reset I18nManager.isRTL to false before each test
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    jest.resetModules(); // Clear module cache to re-evaluate imports
  });

  it("initializes with default Japanese if no locale is detected", () => {
    (Localization.getLocales as jest.Mock).mockReturnValue([]); // Simulate no locale detected
    const { lang: reloadedLang, t: reloadedT } = require("./index");

    expect(reloadedLang).toBe("ja");
    expect(reloadedT("home.title")).toBe(translations.ja.home.title);
  });

  it("initializes with English locale and LTR direction", () => {
    const { lang: reloadedLang, isRTL: reloadedIsRTL, t: reloadedT } = require("./index");

    expect(reloadedLang).toBe("en");
    expect(reloadedIsRTL).toBe(false);
    expect(reloadedT("home.title")).toBe(translations.en.home.title);
    expect(I18nManager.forceRTL).not.toHaveBeenCalled();
    expect(I18nManager.allowRTL).not.toHaveBeenCalled();
  });

  it("initializes with Arabic locale and RTL direction, forcing I18nManager", () => {
    (Localization.getLocales as jest.Mock).mockReturnValue([
      { languageCode: "ar", textDirection: "rtl" },
    ]);
    // Set I18nManager.isRTL to false initially to simulate a change
    Object.defineProperty(I18nManager, 'isRTL', { value: false, configurable: true });
    jest.resetModules(); // Clear module cache to re-evaluate imports
    const { lang: reloadedLang, isRTL: reloadedIsRTL, t: reloadedT } = require("./index");

    expect(reloadedLang).toBe("ar");
    expect(reloadedIsRTL).toBe(true);
    expect(reloadedT("home.title")).toBe(translations.ar.home.title);
    expect(I18nManager.forceRTL).toHaveBeenCalledWith(true);
    expect(I18nManager.allowRTL).toHaveBeenCalledWith(true);
  });

  it("translates a key correctly for English", () => {
    const { t: reloadedT } = require("./index");
    expect(reloadedT("home.title")).toBe("Home");
  });

  it("translates a key correctly for Japanese (default)", () => {
    (Localization.getLocales as jest.Mock).mockReturnValue([
      { languageCode: "ja", textDirection: "ltr" },
    ]);
    jest.resetModules();
    const { t: reloadedT } = require("./index");
    expect(reloadedT("home.title")).toBe("ホーム");
  });

  it("handles interpolation correctly", () => {
    (Localization.getLocales as jest.Mock).mockReturnValue([
      { languageCode: "en", textDirection: "ltr" },
    ]);
    jest.resetModules();
    const { t: reloadedT } = require("./index");
    expect(reloadedT("kanban.boardIdDisplay", { id: "123" })).toBe("Board ID: 123");
  });

  it("falls back to default locale (Japanese) for missing keys in English", () => {
    // Simulate a missing key in English but present in Japanese
    const mockTranslations = {
      en: {
        home: {
          title: "Home",
          // missing subtitle
        },
      },
      ja: {
        home: {
          title: "ホーム",
          subtitle: "これはサブタイトルです",
        },
      },
    };
    jest.doMock("./translations", () => ({ translations: mockTranslations }));
    (Localization.getLocales as jest.Mock).mockReturnValue([
      { languageCode: "en", textDirection: "ltr" },
    ]);
    jest.resetModules();
    const { t: reloadedT } = require("./index");

    expect(reloadedT("home.subtitle")).toBe("これはサブタイトルです");
  });

  it("returns the key itself if not found in any locale (and fallback is enabled)", () => {
    // Simulate a missing key in all locales
    const mockTranslations = {
      en: { home: { title: "Home" } },
      ja: { home: { title: "ホーム" } },
    };
    jest.doMock("./translations", () => ({ translations: mockTranslations }));
    (Localization.getLocales as jest.Mock).mockReturnValue([
      { languageCode: "en", textDirection: "ltr" },
    ]);
    jest.resetModules();
    const { t: reloadedT } = require("./index");

    expect(reloadedT("non.existent.key")).toBe("non.existent.key");
  });
});

