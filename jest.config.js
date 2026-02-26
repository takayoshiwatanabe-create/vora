module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/api/(.*)$": "<rootDir>/src/api/$1",
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@/stores/(.*)$": "<rootDir>/src/stores/$1",
    "^@/types/(.*)$": "<rootDir>/src/types/$1",
    "^@/i18n$": "<rootDir>/i18n/index.ts",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.{ts,tsx}",
    "!**/coverage/**",
    "!**/node_modules/**",
    "!**/babel.config.js",
    "!**/jest.config.js",
    "!**/jest.setup.js",
    "!**/app.json",
    "!**/app/_layout.tsx", // Exclude _layout as it's mostly routing/setup
    "!**/app/index.tsx", // Exclude root index as it's mostly routing/setup
    "!**/lib/supabase.ts", // Exclude supabase client setup
    "!**/i18n/translations.ts", // Exclude translation data
  ],
  coverageReporters: ["json", "html", "text", "text-summary"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
};
