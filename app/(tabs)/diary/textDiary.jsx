import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
  PixelRatio,
  Keyboard,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from "../../../constants/Colors.ts";
import { useDarkMode } from "../../../contexts/DarkModeContext.jsx";
import { format } from "date-fns";
import { useRouter, useLocalSearchParams } from "expo-router";
import { formatDateHeader } from "../../../Logic/diaryFunction.jsx";
import {
  saveTextDiary,
  finalSave,
  getDiaryByDate,
} from "../../../utils/diary.tsx";

export default function DiaryEditor() {
  const [showNewDiv, setShowNewDiv] = useState(false);
  const [showFinalPage, setShowFinalPage] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [diaryText, setDiaryText] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { isDarkMode } = useDarkMode();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  if (!router) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 오늘 날짜의 시간을 00:00:00으로 설정


    // 임시저장 데이터 있으면 불러오기
    const fetchDiary = async (date) => {
      setIsLoading(true);
      const formattedDate = format(date, "yyyy-MM-dd");
      try {
        const res = await getDiaryByDate(formattedDate);
        if (res==null) setDiaryText("");
        else setDiaryText(res?.content ?? "");
      } catch (err) {
        setDiaryText("");
      }
      setIsLoading(false);
    };

    const params = useLocalSearchParams();
    useEffect(() => {
      if (params?.date) {
        const parsedDate = new Date(params.date);
        if (!isNaN(parsedDate)) {
          setSelectedDate(parsedDate);
          fetchDiary(parsedDate);
        }
      }
    }, [params?.date]);

  // 키보드 이벤트 리스너 추가
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // 코멘트 요청
  const handleComment = async () => {
    setIsLoading(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    try {
      await finalSave({ content: diaryText, date: formattedDate });
      setShowNewDiv(false);
      setShowFinalPage(true);
      setDiaryText("");

      setTimeout(() => {
        router.push({
          pathname: "/diary/DiaryFinal",
          params: { date: formattedDate },
        });
        setIsLoading(false);
      }, 500); // 0.3초만 딜레이
    } catch (err) {
      console.error("코멘트 요청 실패:", err);
      setIsLoading(false);
      Alert.alert("에러", "코멘트 요청에 실패했습니다.");
    }
  };

  // 코멘트 요청
  const comment = () => {
    Alert.alert(
      "코멘트를 생성하면 더이상 일기를 수정할 수 없습니다.",
      "코멘트 요청을 하시겠습니까?",
      [
        {
          text: "네",
          onPress: handleComment,
        },
        { text: "아니오", style: "cancel" },
      ]
    );
  };

  const renderLoading = () => {
    if (!isLoading) return null;

    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ marginBottom: 10 }}>로딩 중입니다...</Text>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  };

  const showDatepicker = () => {
    router.push("/diary");
  };

  // 임시저장 버튼
  const handleSaveDiary = async () => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    try {
      await saveTextDiary({ content: diaryText, date: formattedDate });
      Alert.alert("임시저장 완료", "다이어리가 저장되었습니다.");
    } catch (err) {
      console.error("저장 실패:", err);
      Alert.alert("오류", "다이어리 저장에 실패했습니다.");
    }
  };



  return (
    <View style={styles.main}>
      <StatusBar style="auto" />
      {renderLoading()}
      {!showFinalPage && (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={showDatepicker}
              style={styles.datePickerButton}
            >
              <Text style={styles.headerText}>
                {formatDateHeader(selectedDate)}
              </Text>
              <Image
                source={require("../../../assets/images/icons-right-arrow.png")}
                style={{ width: 20, height: 20, marginLeft: 10 }}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View
              style={[
                styles.diaryDiv,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.5)"
                    : "rgba(255,230,213, 0.5)",
                },
              ]}
            >
              <TextInput
                style={[styles.divText, { flex: 1 }]}
                placeholder="다이어리 작성.."
                multiline
                value={diaryText}
                // 2500자 제한
                onChangeText={(text) => {
                  if (text.length <= 2500) {
                    setDiaryText(text);
                  } else {
                    setDiaryText(text.slice(0, 2500));
                    Alert.alert("최대 2500자까지만 입력할 수 있습니다.");
                  }
                }}
                maxLength={2500} // 입력 자체를 막음 (UI상)
              />
            </View>
          </ScrollView>

          {!keyboardVisible && (
            <>
              {!showNewDiv && (
                <View>
                  <View style={styles.buttons}>
                    <TouchableOpacity
                      onPress={handleSaveDiary}
                      style={{ marginLeft: "auto" }}
                    >
                      <View
                        style={[
                          styles.container_1,
                          {
                            backgroundColor: isDarkMode
                              ? "white"
                              : Colors.subPrimary,
                          },
                        ]}
                      >
                        <Text>임시저장</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={comment}>
                    <View style={styles.container}>
                      <Text>코멘트 요청하기 </Text>
                      <Image
                        source={require("../../../assets/images/icons-right-arrow.png")}
                        style={{
                          width: 16,
                          height: 16,
                          marginLeft: 2,
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    marginVertical: 50,
    marginHorizontal: 25,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 20,
  },

  headerText: {
    fontFamily: "roboto",
    fontSize: 25,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  diaryDiv: {
    borderRadius: 10,
    flex: 1,
    padding: 10,
    borderWidth: 0.5,
    borderColor: "rgba(158, 150, 150, .5)",
  },
  divText: {
    color: "black",
    fontSize: 15,
    fontFamily: "roboto",
    fontWeight: "400",
    height: "100%",
    flex: 1,
    textAlignVertical: "top",
  },
  container_1: {
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderRadius: 10,
    marginVertical: 15,
  },
  container: {
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 17,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 0.5,
    borderColor: "rgba(158, 150, 150, .5)",
  },
  voice: {
    alignItems: "center",
    marginVertical: 12,
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  newDiv: {
    marginTop: 15,
    flex: 0.6,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
});
