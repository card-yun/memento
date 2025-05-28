import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { createYearButtons, createMonthButtons, createDayButtons} from "../../../Logic/diaryFunction.jsx";
import DatePickerModal from "../../../Logic/DatePickerModal2";
import DiaryPickerModal from "../../../Logic/DiaryPickerModal.jsx";
import { useRouter } from 'expo-router';
import { Colors } from "../../../constants/Colors.ts";
import { useFocusEffect } from '@react-navigation/native';
import { format } from "date-fns";
import { getDiaryByDate } from '../../../utils/diary.tsx';

export default function Diary() {
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const router = useRouter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

    useFocusEffect(
      useCallback(() => {
        setShowDateModal(true);
        setShowDiaryModal(false);
        return () => {
          setShowDateModal(false);
          setShowDiaryModal(false);
        };
      }, [])
    );

  // 날짜 선택 후 조건 분기
  const handleConfirmDate = async () => {
    try {
      const formattedDate = format(tempDate, "yyyy-MM-dd");
      const res = await getDiaryByDate(formattedDate);
      if(!res){
        setShowDateModal(false);
        setShowDiaryModal(true);
        return;
      }
      if (res.day.emotion) {
        router.push({ pathname: "/diary/DiaryFinal", params: { date: formattedDate } });
      } else if ((res.audio_path) && (res.audio_path !== "empty")) {
        router.push({ pathname: "/diary/audioDiary", params: { date: formattedDate } });
      } else {
        router.push({ pathname: "/diary/textDiary", params: { date: formattedDate } });
      }
    } catch (e) {
      setShowDateModal(false);
      setShowDiaryModal(true);
    }
  };

  // 유형 선택 시 이동
  const handleDiarySelect = (type) => {
    setShowDiaryModal(false);
    const formattedDate = format(tempDate, "yyyy-MM-dd");
    if (type === "audio") {
      router.push({ pathname: "/diary/audioDiary", params: { date: formattedDate } });
    } else {
      router.push({ pathname: "/diary/textDiary", params: { date: formattedDate } });
    }
  };

  const handleCancelDate = () => {
      setShowDateModal(false);
      router.push("../home");
  };


  const handleCancelDiary = () => {
    setShowDiaryModal(false);
    setShowDateModal(true);
  }

  return (
    <View>
      <DatePickerModal
        visible={showDateModal}
        transparent={true}
        onConfirm={handleConfirmDate}
        onCancel={handleCancelDate}
        onRequestCslose={() => setShowDateModal(false)}
        createYearButtons={() => 
          createYearButtons({ tempDate, setTempDate, today })}
        createMonthButtons={() =>
          createMonthButtons({ tempDate, setTempDate, today })}
        createDayButtons={() =>
          createDayButtons({ tempDate, setTempDate, today })}
        tempDate={tempDate || new Date()}
        setTempDate ={setTempDate}
        today={today}
        router={router}
      />
        <DiaryPickerModal
          visible={showDiaryModal}
          onClose={handleCancelDiary}
          onSelect={handleDiarySelect}
      />
    </View>
  );
}
