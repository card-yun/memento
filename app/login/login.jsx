import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { login } from "../../utils/api";

import { Colors } from "./../../constants/Colors.ts";
import { useDarkMode } from "../../contexts/DarkModeContext.jsx";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAccessToken } from "../../utils/api";
import {storeAccessToken} from "../../utils/token";

export default function Login() {
  const { isDarkMode } = useDarkMode();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        setAccessToken(token);   // 헤더에 바로 세팅
        router.replace("/home"); // 홈으로 이동!
      } else {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <View><Text>자동 로그인 중...</Text></View>;

  const Login = async () => {
    if (!email || !password) {
      Alert.alert("알림", "이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      const res = await login(email, password);
      Alert.alert("로그인 성공!");
      console.log("✅ 로그인 성공");

      await storeAccessToken(res.access_token, res.refresh_token);

      setAccessToken(res.access_token);
      router.replace("/home");
      
    } catch (err) {
      console.log("❌ 로그인 전체 실패:", err);
      Alert.alert(
        "로그인 실패",
        "이메일이 존재하지 않거나, 비밀번호가 올바르지 않습니다."
      );
    }
  };
  const SignUp = () => {
    router.push("./SignUp");
  };
  const Passwd = () => {
    router.push("./findPW");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>로그인</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
          ]}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          maxLength={40}
        />
        <TextInput
          style={[
            styles.input,
            { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
          ]}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          maxLength={20}
        />
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isDarkMode ? "white" : "#ffe6d5" },
          ]}
          onPress={Login}
        >
          <Text style={styles.buttontext}>로그인</Text>
        </TouchableOpacity>
        <View style={styles.buttonView}>
          <TouchableOpacity onPress={Passwd}>
            <Text style={[styles.buttontext, { opacity: 0.5 }]}>
              비밀번호 찾기 &gt;
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={SignUp}>
            <Text style={[styles.buttontext, { opacity: 0.5 }]}>
              회원가입 &gt;
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.logo}>(c) Memento</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 40,
    // marginTop: 40,
    justifyContent: "center",
    width: "100%",
    padding: 20,
  },
  header: {
    marginTop: "40%",
    fontSize: 30,
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "roboto",
  },
  inputContainer: {
    justifyContent: "center",
    width: "100%",
    padding: 20,
  },
  input: {
    opacity: 0.5,
    marginBottom: 15,
    padding: 15,
    borderRadius: 100,
  },
  button: {
    borderRadius: 100,
    alignItems: "center",
    paddingVertical: 13,
    marginBottom: 15,
  },
  buttontext: {
    color: "#4d4d4d",
    fontSize: 13,
  },
  buttonView: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  linkText: {
    color: "#4d4d4d",
  },
  logo: {
    color: "#4d4d4d",
    textAlign: "center",
    marginTop: 40,
  },
});
