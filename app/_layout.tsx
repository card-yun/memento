import { Stack,  usePathname  } from "expo-router";
import { useFonts } from "expo-font";
import React, { useEffect, useState } from "react";
import { DarkModeProvider } from "../contexts/DarkModeContext";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAccessToken } from "../utils/api";
import { loadAccessToken } from "../utils/token";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

 const [fontsLoaded] = useFonts({
    roboto: require("./../assets/fonts/Roboto-Regular.ttf"),
    "roboto-medium": require("./../assets/fonts/Roboto-Medium.ttf"),
    "roboto-semibold": require("./../assets/fonts/Roboto-SemiBold.ttf"),
  });

 
  useEffect(() => {
    (async () => {
      const token = await loadAccessToken();
      if (token) {
        setAccessToken(token);
        setLoading(false);
      } else {
        setLoading(false);
        router.replace("/login/login");
      }
    })();
  }, []);

  if (loading) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}


  return (
    <DarkModeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login/login" />
      </Stack>
    </DarkModeProvider>
  );
}
