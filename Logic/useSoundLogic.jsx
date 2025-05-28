import { Alert } from "react-native";
import { useState } from "react";
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { format } from "date-fns";
import { getDiaryByDate } from "../utils/diary";

const MAX_RECORDING_SECONDS = 300; 

export const useSoundLogic = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recording, setRecording] = useState(null); // Audio.Recording 인스턴스
  const [sound, setSound] = useState(null); // Audio.Sound 인스턴스
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState(null); // 로컬 파일 경로
  const [hasRecording, setHasRecording] = useState(false);
  const [timer, setTimer] = useState(null); // 녹음 시간 측정용 타이머
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태
  const [currentPosition, setCurrentPosition] = useState(0);

const clearRecordingResources = async () => {
  try {
    if (global.recordingInstance) {
      try { await global.recordingInstance.stopAndUnloadAsync(); } catch (e) {}
      global.recordingInstance = null;
    }
    if (recording) {
      try { await recording.stopAndUnloadAsync(); } catch (e) {}
      setRecording(null);
    }
    // 오디오 모드 강제 해제
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
    });
    await new Promise(res => setTimeout(res, 1000)); // 1초 대기
  } catch (e) {
    // 무시
  }
};

  // 눅음 중지 버튼
  const handleStopRecording = async (selectedDate) => {
  if (recording && (isRecording || isPaused)) {
    clearInterval(timer);
    try {
      await recording.stopAndUnloadAsync();
      const tempUri = await recording.getURI();

      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const res = await getDiaryByDate(formattedDate);
      const diaryId = res ? res.id : `temp_${formattedDate}`;
      const localUri = FileSystem.cacheDirectory + `voice_${diaryId}.wav`;
      if (tempUri !== localUri) {
        // 기존 파일 삭제
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (fileInfo.exists) await FileSystem.deleteAsync(localUri, { idempotent: true });
        // 새 파일 복사
        await FileSystem.copyAsync({ from: tempUri, to: localUri });
      }
      
      setRecordingUri(localUri);
      setIsRecording(false);
      setIsPaused(false);
      setHasRecording(true);
      setRecording(null);

      // 기존 오디오 사운드 언로드(필요시)
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

    } catch (err) {
      console.log('녹음 정지 오류:', err);
    }
  }
};

 const handleStartRecording = async () => {
  console.log("녹음버튼 눌림");
  
  // 이미 녹음된 파일이 있는 경우 확인 창 표시
  if (hasRecording || recordingUri) {
    Alert.alert(
      "재녹음하시겠습니까?",
      "이전 녹음이 삭제되고 새로 녹음됩니다.",
      [
        { text: "취소", style: "cancel" },
        { text: "재녹음", style: "destructive", onPress: startRecording }
      ]
    );
  } else {
    startRecording();
  }
};

const startRecording = async () => {
  try {
    console.log("녹음 시작 준비...");
    await clearRecordingResources();
    
    // 1. 기존 자원 정리 (전역 객체 참조)
    if (global.recordingInstance) {
      console.log("전역 녹음 인스턴스 발견, 해제 시도");
      try {
        await global.recordingInstance.stopAndUnloadAsync();
      } catch (e) {
        console.log("전역 인스턴스 해제 오류(무시됨):", e);
      }
      global.recordingInstance = null;
    }
    
    // 2. 로컬 상태의 녹음 객체 정리
    if (recording) {
      console.log("로컬 녹음 상태 발견, 해제 시도");
      try {
        await recording.stopAndUnloadAsync();
      } catch (e) {
        console.log("로컬 인스턴스 해제 오류(무시됨):", e);
      }
      setRecording(null);
    }
    
    // 3. 사운드 객체 정리
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (e) {
        console.log("사운드 해제 오류(무시됨):", e);
      }
      setSound(null);
    }
    
    // 4. 타이머 정리
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    
    // 5. 상태 초기화
    setIsRecording(false);
    setIsPaused(false);
    setRecordingDuration(0);
    setHasRecording(false);
    setRecordingUri(null);
    
    console.log("모든 자원 정리 완료");
    
    // 6. 약간의 지연을 주어 모든 리소스가 해제되도록 함
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 7. 권한 확인
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 거부', '마이크 권한을 허용해야 녹음할 수 있습니다.');
      return;
    }
    
    // 8. 오디오 모드 설정
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    
    console.log("녹음 객체 생성 시작");
    
    // 9. 새 녹음 객체 생성 - 구조분해할당 없이 전체 결과 받기
    const recordingResult = await Audio.Recording.createAsync(
      Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
    );
    
    // 10. 녹음 객체 검증 및 상태 설정
    if (recordingResult && recordingResult.recording) {
      // 전역 변수에도 저장하여 앱 어디서든 접근 가능하게 함
      global.recordingInstance = recordingResult.recording;
      
      // 상태 업데이트
      setRecording(recordingResult.recording);
      setIsRecording(true);
      
      // 타이머 시작
      const id = setInterval(() => {
        setRecordingDuration(prev => {
          // 5분(300초) 제한: 자동 중지
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            clearInterval(id);
            setTimer(null);
            handleStopRecording(); // 자동으로 녹음 정지 함수 호출
            Alert.alert("알림", "최대 5분까지만 녹음할 수 있습니다.");
            return prev; // 바로 리턴 (더 이상 증가 안 함)
          }
          return prev + 1;
        });
      }, 1000);
      setTimer(id);
      
      console.log("녹음 시작 성공!");
    } else {
      console.error("녹음 객체가 생성되지 않았습니다:", recordingResult);
      Alert.alert("오류", "녹음을 시작할 수 없습니다. 앱을 다시 시작해보세요.");
    }
  } catch (err) {
    console.log('녹음 시작 오류:', err);
    Alert.alert("녹음 오류", "녹음을 시작하는 중 문제가 발생했습니다.");
  }
};


const pauseRecording = async () => {
  if (recording && isRecording && !isPaused) {
    await recording.pauseAsync();
    setIsPaused(true);
    clearInterval(timer);
  }
};
const resumeRecording = async () => {
  if (recording && isRecording && isPaused) {
    await recording.startAsync();
    setIsPaused(false);
    // 타이머 재시작
    const id = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
    setTimer(id);
  }
};

  const playRecording = async (selectedDate) => {
  try {
    let uri = recordingUri;

    // 1. recordingUri가 없으면 getDiaryByDate로 id 받아오기
    if (!uri && selectedDate) {
      setIsLoading(true);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const diaryRes = await getDiaryByDate(formattedDate);

      // diary_id 추출
      const diaryId = diaryRes?.id;

      if (!diaryId) {
        setIsLoading(false);
        Alert.alert("일기 ID 없음", "오디오 파일을 찾을 수 없습니다.");
        return;
      }

      const url = await getAudioFile(diaryId);
      const fileName = `voice_${diaryId}.wav`;
      const localUri = FileSystem.cacheDirectory + fileName;

      // 기존 파일 삭제
      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists) await FileSystem.deleteAsync(localUri);

      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      uri = localUri;
      setIsLoading(false);
    }

    if (!uri) return;

    console.log("재생 직전 uri:", uri);
    const { sound } = await Audio.Sound.createAsync({ uri });
    setSound(sound);
    setIsPlaying(true);

    sound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded) {
          setCurrentPosition(status.positionMillis || 0);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentPosition(0);
            sound.unloadAsync();
          }
        }
    });

    await sound.playAsync();
  } catch (err) {
    Alert.alert('오디오 재생 실패', err.message || String(err));
    console.log('[재생 오류]', err, uri);
    setIsPlaying(false);
  }
};

const pausePlaying = async () => {
  if (sound && isPlaying) {
    await sound.pauseAsync();
    setIsPlaying(false);
  }
};

    return {
      isRecording, setIsRecording,
      isPaused, setIsPaused,
      isPlaying, setIsPlaying,
      recording, setRecording,
      sound, setSound,
      recordingDuration, setRecordingDuration,
      recordingUri, setRecordingUri,
      hasRecording, setHasRecording,
      timer, setTimer,
      isLoading, setIsLoading,
      currentPosition, setCurrentPosition,
      handleStartRecording,
      startRecording, pauseRecording, resumeRecording,
      playRecording, pausePlaying, handleStopRecording
  };
};