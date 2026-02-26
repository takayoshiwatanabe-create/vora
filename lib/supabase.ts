```diff
--- a/lib/supabase.ts
+++ b/lib/supabase.ts
@@ -1,6 +1,6 @@
 import { createClient } from "@supabase/supabase-js";
 import Constants from "expo-constants";
-import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
+import AsyncStorage from "@react-native-async-storage/async-storage";
 
 // Access environment variables from Constants.expoConfig.extra
 const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl as string | undefined;
```
