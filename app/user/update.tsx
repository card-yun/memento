import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { updateUserPartial } from "../../utils/api";

import { Colors } from "../../constants/Colors";
import { useDarkMode } from "../../contexts/DarkModeContext";

import {
  sendEmailVerificationCode,
  verifyEmailCode,
  updatePassword,
} from "../../utils/api"; // 위치 맞춰서 import

export default function SignUp() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const { isDarkMode } = useDarkMode();

  const [verificationCode, setVerificationCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [passwordError, setPasswordError] = useState(""); // 기존 비밀번호 오류 표시용

  const [passwordLengthError, setPasswordLengthError] = useState("");
  const [passwordFormatError, setPasswordFormatError] = useState("");

  function validatePasswordFields(pw: string) {
    if (pw.length < 8 || pw.length > 20) {
      setPasswordLengthError("비밀번호는 8자 이상 20자 이하이어야 합니다.");
    } else {
      setPasswordLengthError("");
    }

    const formatRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/;
    if (!formatRegex.test(pw)) {
      setPasswordFormatError("영문자, 숫자, 특수문자를 모두 포함해야 합니다.");
    } else {
      setPasswordFormatError("");
    }
  }

  const Back = () => {
    router.push("../(tabs)/setting");
  };

  function convertAgeToGroup(
    ageStr: string
  ): "10대" | "20대" | "30대" | "40대" | "50대" | "60대 이상" {
    const age = parseInt(ageStr);
    if (isNaN(age)) return "10대"; // 기본값
    if (age < 20) return "10대";
    if (age < 30) return "20대";
    if (age < 40) return "30대";
    if (age < 50) return "40대";
    if (age < 60) return "50대";
    return "60대 이상";
  }

  const handleUpdate = async () => {
    setPasswordError(""); // 초기화

    if (!nickname.trim() || !age.trim()) {
      Alert.alert("알림", "닉네임과 나이를 모두 입력해주세요.");
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim()) {
      Alert.alert("알림", "기존 비밀번호와 새 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (passwordLengthError || passwordFormatError) {
      Alert.alert("알림", "새 비밀번호 형식을 확인해주세요.");
      return;
    }

    try {
      // 1. 비밀번호 먼저 수정
      await updatePassword(currentPassword.trim(), newPassword.trim());

      // 2. 닉네임 + 나이 수정
      await updateUserPartial({
        nickname: nickname.trim(),
        age_group: convertAgeToGroup(age),
      });

      Alert.alert("회원정보 수정", "회원정보가 성공적으로 변경되었습니다.");
      router.push("../(tabs)/home");
    } catch (err: any) {
      const msg = err.message || "";

      if (
        msg.includes("Incorrect password") ||
        msg.includes("at least 8 characters") || // 문자열 길이 에러
        msg.includes("value does not match the regex") // 정규식 실패 에러 (형식 오류) // 메시지는 이게 아니겠지만.
      ) {
        setPasswordError("현재 비밀번호가 올바르지 않습니다.");
      } else if (msg.includes("New password cannot be the same")) {
        Alert.alert("오류", "새 비밀번호는 기존 비밀번호와 달라야합니다.");
      } else {
        Alert.alert("오류", msg || "회원정보 수정에 실패했습니다.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={Back}
        style={{ marginTop: 10, marginLeft: 10 }}
      >
        <Ionicons name="chevron-back-outline" size={30} color={"#888888"} />
      </TouchableOpacity>
      <ScrollView
        style={styles.main}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>회원정보 수정</Text>
        </View>

        <View>
          <View style={styles.subheader}>
            <Text>닉네임</Text>
          </View>
          <View
            style={[
              styles.div,
              { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
            ]}
          >
            <TextInput
              style={styles.divText}
              placeholder="닉네임 *"
              value={nickname}
              onChangeText={setNickname}
            />
          </View>
        </View>

        <View>
          <View style={styles.subheader}>
            <Text>나이</Text>
          </View>
          <View
            style={[
              styles.div,
              { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
            ]}
          >
            <TextInput
              style={styles.divText}
              placeholder="나이 *"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>
        </View>
        <View>
          <View style={styles.subheader}>
            <Text>기존 비밀번호</Text>
          </View>
          <View
            style={[
              styles.div,
              { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
            ]}
          >
            <TextInput
              style={styles.divText}
              placeholder="기존 비밀번호 *"
              secureTextEntry={true}
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                setPasswordError(""); // 입력시 에러 제거
              }}
            />
          </View>
          {/* ❗️빨간 에러 메시지 출력 */}
          {passwordError ? (
            <Text
              style={{
                color: "red",
                fontSize: 12,
                marginLeft: 5,
                marginTop: -2,
                marginBottom: 8,
              }}
            >
              {passwordError}
            </Text>
          ) : null}
        </View>
        <View>
          <View style={styles.subheader}>
            <Text>새 비밀번호</Text>
          </View>
          <View
            style={[
              styles.div,
              { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
            ]}
          >
            <TextInput
              style={styles.divText}
              placeholder="비밀번호 재설정 *"
              secureTextEntry={true}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                validatePasswordFields(text);
              }}
            />
          </View>
          {passwordLengthError ? (
            <Text style={{ color: "red", fontSize: 12, marginLeft: 5 }}>
              {passwordLengthError}
            </Text>
          ) : null}
          {passwordFormatError ? (
            <Text
              style={{
                color: "red",
                fontSize: 12,
                marginLeft: 5,
                marginBottom: 8,
              }}
            >
              {passwordFormatError}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isDarkMode ? "white" : "#ffe6d5" },
          ]}
          onPress={handleUpdate}
        >
          <Text style={styles.buttontext}>회원정보 수정</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    marginHorizontal: 22,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 60,
    marginBottom: 40,
  },
  headerText: {
    fontFamily: "roboto",
    fontSize: 30,
  },
  container: {
    marginTop: 10,
    justifyContent: "center",
    width: "100%",
  },
  title: {
    fontSize: 24,
    marginBottom: 35,
    textAlign: "center",
  },

  div: {
    // backgroundColor: Colors.subPrimary,
    opacity: 0.5,
    marginBottom: 13,
    paddingVertical: 5,
    paddingHorizontal: 22,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subheader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    marginHorizontal: 4,
    opacity: 0.5,
  },
  divText: {
    fontSize: 15,
    fontFamily: "roboto",
    fontWeight: "400",
    flex: 1,
    minHeight: 40,
  },

  button: {
    marginTop: 20,
    marginBottom: "10%",
    paddingVertical: 13,
    backgroundColor: Colors.subPrimary,
    borderRadius: 100,
    alignItems: "center",
  },
  buttontext: {
    fontSize: 16,
    opacity: 0.8,
  },
  buttonView: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
