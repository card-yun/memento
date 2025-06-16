import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "./../../constants/Colors.ts";

import { useRouter } from "expo-router";
import { useDarkMode } from "../../contexts/DarkModeContext";

import { sendEmailVerificationCode, verifyEmailCode } from "../../utils/api"; // 위치 맞춰서 import

import { resetPasswordByEmail } from "../../utils/api.ts"; // 경로 맞게 조정

export default function FindPW() {
  const { isDarkMode } = useDarkMode();

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [passwordLengthError, setPasswordLengthError] = useState("");
  const [passwordFormatError, setPasswordFormatError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isVerified, setIsVerified] = useState(false);

  function validatePasswordFields(pw) {
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

  const sendVerificationCode = async () => {
    if (!email.trim()) {
      Alert.alert("알림", "이메일을 입력해주세요.");
      return;
    }

    try {
      const res = await sendEmailVerificationCode(email.trim());
      Alert.alert(
        "인증번호 발송",
        `인증번호가 발송되었습니다.${"\n"}인증번호를 입력해주세요.`
      ); //send_code
    } catch (err) {
      Alert.alert(
        "실패",
        "가입된 이메일이 아닙니다." || "인증번호 발송에 실패했습니다."
      );
    }
  };

  const checkVerificationCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert("알림", "인증번호를 다시 확인해주세요.");
      return;
    }

    try {
      const res = await verifyEmailCode(email.trim(), verificationCode.trim());
      setIsVerified(true); // ✅ 인증 성공 표시
      Alert.alert("인증 성공", "이메일 인증 성공"); // ex: "인증 성공"
      // 필요 시 상태 저장: setIsVerified(true);
    } catch (err) {
      setIsVerified(false); // ✅ 인증 실패시 인증 무효화
      const msg = err.message || "";
      // 특정 에러 메시지를 감지해 한국어로 번역
      if (msg.includes("Invalid verification code")) {
        Alert.alert("인증 실패", "인증번호가 다릅니다.");
      } else {
        Alert.alert("인증 실패", "인증에 실패했습니다.");
      }
    }
  };

  const resetPassword = async () => {
    if (!isVerified) {
      Alert.alert("인증 필요", "이메일 인증을 먼저 완료해주세요.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("비밀번호 불일치", "비밀번호가 일치하지 않습니다.");
      return;
    }

    if (passwordLengthError || passwordFormatError) {
      Alert.alert("알림", "비밀번호 조건을 확인해주세요.");
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("알림", "새 비밀번호와 비밀번호 확인란을 모두 입력해주세요.");
      return;
    }

    try {
      await resetPasswordByEmail(email.trim(), newPassword);
      Alert.alert("성공", "비밀번호가 성공적으로 변경되었습니다.", [
        {
          text: "확인",
          onPress: () => router.push("./login"), // ✅ 여기서 login으로 이동
        },
      ]);
    } catch (err) {
      Alert.alert("오류", err.message || "비밀번호 변경에 실패했습니다.");
      // ✅ API호출 문제 시.
    }
  };

  const router = useRouter();
  const Back = () => {
    router.push("./login");
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
      <TouchableOpacity
        onPress={Back}
        style={{ marginTop: 20, marginLeft: 20 }}
      >
        <Ionicons name="chevron-back-outline" size={30} color={"#888888"} />
      </TouchableOpacity>
      <View style={styles.main}>
        <StatusBar style="auto" />
        <View style={styles.header}>
          <Text style={styles.headerText}>비밀번호 찾기</Text>
        </View>
        <View>
          <View style={styles.subheader}>
            <Text>이메일</Text>
          </View>
          <View
            style={[
              styles.div,
              { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
            ]}
          >
            <TextInput
              placeholder="가입 이메일 *"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              style={styles.divText}
            />
            <TouchableOpacity onPress={sendVerificationCode}>
              <View
                style={[
                  {
                    borderRadius: 100,
                    paddingVertical: 6, // 글자 여백 확보용 (1.5는 너무 작아서 실제로는 이 정도 필요)
                    paddingHorizontal: 12,
                    backgroundColor: isDarkMode ? "#e0e0e0" : Colors.subPrimary,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Text style={{ fontSize: 12 }}>인증번호 발송</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View>
          <View style={styles.subheader}>
            <Text>인증번호</Text>
          </View>
          <View
            style={[
              styles.div,
              { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
            ]}
          >
            <TextInput
              style={styles.divText}
              placeholder="인증번호 *"
              value={verificationCode}
              onChangeText={(text) => {
                setVerificationCode(text);
                setIsVerified(false); // ✅ 입력 바뀌면 다시 인증 필요
              }}
            />
            <TouchableOpacity onPress={checkVerificationCode}>
              <View
                style={[
                  {
                    borderRadius: 100,
                    paddingVertical: 6, // 글자 여백 확보용 (1.5는 너무 작아서 실제로는 이 정도 필요)
                    paddingHorizontal: 12,
                    backgroundColor: isDarkMode ? "#e0e0e0" : Colors.subPrimary,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
              >
                <Text style={{ fontSize: 12 }}>인증 확인</Text>
              </View>
            </TouchableOpacity>
          </View>
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
          {/* 유효성 검사 메시지 */}
          {!!passwordLengthError && (
            <Text
              style={{
                color: "red",
                fontSize: 12,
                marginLeft: 5,
                marginBottom: 2,
              }}
            >
              {passwordLengthError}
            </Text>
          )}
          {!!passwordFormatError && (
            <Text
              style={{
                color: "red",
                fontSize: 12,
                marginLeft: 5,
                marginBottom: 12,
              }}
            >
              {passwordFormatError}
            </Text>
          )}
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
              placeholder="비밀번호 확인 *"
              secureTextEntry={true}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
          ]}
          onPress={resetPassword}
        >
          <Text style={styles.buttontext}>비밀번호 재설정</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  main: {
    marginVertical: 30,
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
    fontSize: 26,
  },
  subheader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    marginHorizontal: 4,
    opacity: 0.5,
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
  personalDiv: {
    // backgroundColor: Colors.subPrimary,
    opacity: 0.5,
    paddingVertical: 5,
    paddingHorizontal: 22,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    height: 200,
    // justifyContent: "",
  },
  divText: {
    color: "#000",
    fontSize: 15,
    fontFamily: "roboto",
    fontWeight: "400",
    flex: 1,
    minHeight: 40,
  },
  checkBoxContainer: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  //GPT가 생성한 것. //내가 따로 만들기
  button: {
    marginTop: 20,
    paddingVertical: 13,
    backgroundColor: Colors.subPrimary,
    borderRadius: 100,
    alignItems: "center",
  },
  buttontext: {
    fontSize: 16,
    opacity: 0.8,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginLeft: 5,
    marginBottom: 2,
  },
});
