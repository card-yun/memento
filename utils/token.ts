// utils/token.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAccessToken } from "./api";

const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

let accessToken: string | null = null;

export async function storeAccessToken(accessToken: string, refreshToken: string) {
  await AsyncStorage.setItem(TOKEN_KEY, accessToken);
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  setAccessToken(accessToken);
}

export async function loadAccessToken(): Promise<string | null> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    setAccessToken(token);
  }
  return token;
}

export async function getRefreshToken(): Promise<string | null> {
  return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearAccessToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}
