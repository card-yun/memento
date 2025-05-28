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
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { Colors } from "../../../constants/Colors.ts";
import { useDarkMode } from "../../../contexts/DarkModeContext.jsx";
import { format } from "date-fns";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { formatDateHeader } from "../../../Logic/diaryFunction.jsx";
import {
  saveAudioDiary,
  finalSave,
  getDiaryByDate,
  getAudioFile,
} from "../../../utils/diary.tsx";
import { SERVER_URL } from "../../../utils/api";
import { useSoundLogic } from "../../../Logic/useSoundLogic.jsx";
import { Ionicons } from "@expo/vector-icons";
import { loadAccessToken } from "../../../utils/token";

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return global.btoa(binary); // Expo 환경에서 global.btoa 사용
}

export default function DiaryEditor() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showNewDiv, setShowNewDiv] = useState(false);
  const [showFinalPage, setShowFinalPage] = useState(false);
  const [showRecordingView, setShowRecordingView] = useState(false);
  const [diaryText, setDiaryText] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { isDarkMode } = useDarkMode();

  const {
    isRecording,
    setIsRecording,
    isPaused,
    setIsPaused,
    isPlaying,
    setIsPlaying,
    recording,
    setRecording,
    sound,
    setSound,
    recordingDuration,
    setRecordingDuration,
    recordingUri,
    setRecordingUri,
    hasRecording,
    setHasRecording,
    timer,
    setTimer,
    isLoading,
    setIsLoading,
    handleStartRecording,
    handleStopRecording,
    startRecording,
    pauseRecording,
    resumeRecording,
    playRecording,
    pausePlaying,
  } = useSoundLogic();

  const router = useRouter();
  if (!router) return null;
  const params = useLocalSearchParams();
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 오늘 날짜의 시간을 00:00:00으로 설정
  const openDiv = () => {
    setShowRecordingView(true);
  };

  useEffect(() => {
    if (params?.date) {
      const parsedDate = new Date(params.date);
      if (!isNaN(parsedDate)) {
        setSelectedDate(parsedDate);
      }
    }
    // 초기화 완료 표시
    setIsInitialized(true);
  }, [params?.date]);

  useEffect(() => {
    const setDurationFromFile = async () => {
      if (recordingUri) {
        try {
          // 기존 sound 있으면 언로드
          if (sound) await sound.unloadAsync();
          const { sound: loadedSound } = await Audio.Sound.createAsync({
            uri: recordingUri,
          });
          setSound(loadedSound);
          const status = await loadedSound.getStatusAsync();
          if (status?.durationMillis) {
            setRecordingDuration(Math.floor(status.durationMillis / 1000));
          }
        } catch (e) {
          setRecordingDuration(0);
        }
      }
    };
    setDurationFromFile();
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [recordingUri]);

  // 시간 포맷팅 함수 (00:00 형식)
  function formatTime(sec) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

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

  // 임시저장 데이터 있으면 불러오기
  const fetchDiary = async () => {
    setIsLoading(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    try {
      const res = await getDiaryByDate(formattedDate);

      if (res == null) {
        console.log("📭 일기 없음:", formattedDate);
        setDiaryText("");
        setRecordingUri(null);
        setHasRecording(false);
      } else {
        setDiaryText(res?.content ?? "");

        // 음성 파일 경로가 있으면 서버에서 파일 다운로드 후 recordingUri에 저장
        if (res.audio_path && res.id) {
          const diaryId = res.id;
          try {
            const token = await loadAccessToken();
            const audioUrl = await getAudioFile(diaryId); // URL 반환
            const localUri = FileSystem.cacheDirectory + `voice_${diaryId}.wav`;

            // === [1] 인증 포함 fetch로 파일 받아와 blob으로 변환 ===
            const response = await fetch(audioUrl, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (!response.ok) {
              const text = await response.text();
              console.log("[DEBUG] fetch 응답:", text);
              setRecordingUri(null);
              setHasRecording(false);
              return;
            }
            const blob = await response.blob();

            // === [2] blob → base64 변환해서 파일 저장 ===
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64data = reader.result.split(",")[1];
              // 기존 파일 삭제
              const existing = await FileSystem.getInfoAsync(localUri);
              if (existing.exists) await FileSystem.deleteAsync(localUri);

              await FileSystem.writeAsStringAsync(localUri, base64data, {
                encoding: FileSystem.EncodingType.Base64,
              });

              // 파일 존재 및 크기 확인
              const fileInfo = await FileSystem.getInfoAsync(localUri);
              console.log("[DEBUG] fileInfo:", fileInfo);
              if (!fileInfo.exists || fileInfo.size < 1000) {
                setRecordingUri(null);
                setHasRecording(false);
                console.log("오디오 파일이 존재하지 않거나 손상됨:", localUri);
                return;
              }

              setRecordingUri(localUri);
              setHasRecording(true);
            };
            reader.readAsDataURL(blob);
          } catch (audioErr) {
            setRecordingUri(null);
            setHasRecording(false);
            console.log("오디오 파일 불러오기 실패:", audioErr);
          }
        } else {
          setRecordingUri(null);
          setHasRecording(false);
        }
      }
    } catch (err) {
      setDiaryText("");
      setRecordingUri(null);
      setHasRecording(false);
      console.log("일기 불러오기 실패:", err);
    }
    setIsLoading(false);
  };
  useEffect(() => {
    if (!isInitialized) return;
    fetchDiary();
  }, [selectedDate, isInitialized]);

  // 음성 파일 저장
  const handleSaveDiary = async () => {
    if (!hasRecording || !recordingUri) return;
    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const audioFile = await FileSystem.getInfoAsync(recordingUri);
      await saveAudioDiary({
        date: formattedDate,
        audio_path: recordingUri,
        audio_file: audioFile,
      });
      Alert.alert("저장 완료", "음성일기가 저장되었습니다.");
      setShowRecordingView(false);
      setHasRecording(false);
      setRecordingUri(null);
      setRecording(null);
      await fetchDiary();
    } catch (err) {
      console.error("저장 실패:", err);
      Alert.alert("에러", "음성 저장에 실패했습니다.");
    }
    setIsLoading(false);
  };

  // 코멘트 요청
  const handleComment = async () => {
    setIsLoading(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    try {
      const audioFile = await FileSystem.getInfoAsync(recordingUri);
      await finalSave({
        date: formattedDate,
        audio_path: recordingUri,
        audio_file: audioFile,
      });
      setShowNewDiv(false);
      setShowFinalPage(true);

      setTimeout(() => {
        router.push({
          pathname: "/diary/DiaryFinal",
          params: { date: formattedDate },
        });
        setIsLoading(false);
      }, 300); // 0.3초만 딜레이
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

  return (
    <View style={styles.main}>
      <StatusBar style="auto" />
      {renderLoading()}
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
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
            placeholder="하단의 마이크 버튼을 클릭해 음성을 녹음해주세요.."
            style={styles.divText}
            editable={false}
            multiline
            value={diaryText}
          />
        </View>
      </ScrollView>
      {/* 녹음 화면 */}
      {showRecordingView ? (
        <View style={styles.recordingCard}>
          <View style={styles.recordingHeader}>
            <TouchableOpacity onPress={() => setShowRecordingView(false)}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
            <Text style={styles.recordingTimer}>
              {formatTime(recordingDuration)} / 05:00
            </Text>
          </View>

          <View style={styles.recordingControls}>
            <View
              style={[
                styles.microphoneCircle,
                isRecording && !isPaused && styles.pulsatingCircle,
              ]}
            >
              <Ionicons
                name="mic"
                size={60}
                color={isRecording && !isPaused ? "#e53e3e" : "#8f8f8f"}
              />
            </View>

            <View style={styles.controlButtons}>
              {/* 재생 버튼 */}
              <TouchableOpacity
                onPress={() => {
                  if (isPlaying) {
                    pausePlaying();
                  } else {
                    playRecording(selectedDate);
                  }
                }}
                disabled={!hasRecording || isRecording || isPaused}
                style={[
                  styles.controlButton,
                  hasRecording && !isRecording && !isPaused
                    ? styles.activeControlButton
                    : styles.inactiveControlButton,
                ]}
              >
                <Ionicons
                  name={isPlaying ? "pause-circle" : "play-circle"}
                  size={24}
                  color={
                    hasRecording && !isRecording && !isPaused
                      ? "#FFF"
                      : "#8f8f8f"
                  }
                />
              </TouchableOpacity>

              {/* 녹음 버튼 */}
              {isRecording ? (
                isPaused ? (
                  <TouchableOpacity
                    onPress={resumeRecording}
                    style={styles.recordButton}
                  >
                    <Ionicons name="play-circle" size={32} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={pauseRecording}
                    style={[styles.recordButton, styles.activeRecordButton]}
                  >
                    <Ionicons name="pause-circle" size={32} color="#fff" />
                  </TouchableOpacity>
                )
              ) : (
                <TouchableOpacity
                  onPress={() => handleStartRecording(selectedDate)}
                  style={styles.recordButton}
                >
                  <Ionicons name="mic" size={32} color="#fff" />
                </TouchableOpacity>
              )}

              {/* 중지 버튼 */}
              <TouchableOpacity
                onPress={() => handleStopRecording(selectedDate)}
                disabled={!isRecording && !isPaused}
                style={[
                  styles.controlButton,
                  isRecording || isPaused
                    ? styles.activeStopButton
                    : styles.inactiveControlButton,
                ]}
              >
                <Ionicons
                  name="stop-circle"
                  size={24}
                  color={isRecording || isPaused ? "#fff" : "#8f8f8f"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View>
          <View style={styles.buttons}>
            <TouchableOpacity onPress={openDiv}>
              <Image
                source={require("../../../assets/images/microphone.png")}
                style={{
                  width: 18,
                  height: 18,
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveDiary}>
              <View
                style={[
                  styles.container_1,
                  { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
                ]}
              >
                <Text>저장하기</Text>
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
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  diaryDiv: {
    borderRadius: 10,
    height: "80%",
    padding: 10,
    borderWidth: 0.5,
    borderColor: "rgba(158, 150, 150, .5)",
  },
  divText: {
    color: "black",
    fontSize: 15,
    fontFamily: "roboto",
    fontWeight: "400",
    height: "90%",
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

  recordingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    borderWidth: 0.5,
    borderColor: "rgba(158, 150, 150, .5)",
  },
  recordingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recordingTimer: {
    fontSize: 14,
    fontWeight: "500",
    color: "#718096",
  },
  recordingControls: {
    alignItems: "center",
    paddingVertical: 32,
  },
  microphoneCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#efefef",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  pulsatingCircle: {
    backgroundColor: "#fed7d7",
  },
  controlButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  activeControlButton: {
    backgroundColor: "#FFE6D5",
  },
  inactiveControlButton: {
    backgroundColor: "#efefef",
  },
  activeStopButton: {
    backgroundColor: "#2d3748",
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF706B",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  activeRecordButton: {
    backgroundColor: "#FF706B",
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    marginTop: 32,
  },
  activeSaveButton: {
    backgroundColor: "#FFE6D5",
  },
  inactiveSaveButton: {
    backgroundColor: "#efefef",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  inactiveButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8f8f8f",
  },
  actionButtonsContainer: {
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fed7d7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  saveIconContainer: {
    backgroundColor: "#bee3f8",
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#2d3748",
  },
});
