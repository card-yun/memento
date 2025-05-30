import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import { useCalendarLogic } from "../../Logic/useCalendarLogic";
import { Colors } from "../../constants/Colors";
import { format } from "date-fns";
import { getDiaryByDate } from '../../utils/diary';

export default function Calendar() {
  const {
    isDarkMode,
    currentDate,
    selectedDate,
    monthNames,
    dayNames,
    today,  // 이제 today 변수를 직접 가져옵니다
    goToPreviousMonth,
    goToNextMonth,
    generateCalendarDays,
    formatDateString,
    isToday,
    isSelected,
    handleDateSelection,
    loadDiariesData,
    getDateStatus,
    renderStatusIndicator,
  } = useCalendarLogic();

  const router = useRouter();

  // 캘린더 초기화 함수
  const initializeCalendar = async () => {
    try {
      await loadDiariesData(true); // 강제 새로고침으로 데이터 로드
      return true;
    } catch (error) {
      console.error('캘린더 초기화 실패:', error);
      return false;
    }
  };

  // 최초 마운트 시 1번 실행
  useEffect(() => {
    initializeCalendar();
  }, []);
  // 페이지가 focus될 때마다 실행됨
  useFocusEffect(
    useCallback(() => {
      initializeCalendar();
    }, [])
  );

  const onDateSelect = (day) => {
  if (day !== null) {
    // 현재 표시된 년도와 월을 사용하여 완전한 Date 객체 생성
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    // 캘린더 내부 상태도 업데이트
    handleDateSelection(day);
    
    // 올바른 형식으로 날짜 포맷팅
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    
    // todo 화면으로 이동
    router.push({
      pathname: '/todolist/todo',
      params: { date: formattedDate },
    });
  }
};

  
    // 날짜 선택 후 조건 분기
 const handleDateSelect = async ({}) => {
    try {
      const formattedDate = format(today, "yyyy-MM-dd");
      const res = await getDiaryByDate(formattedDate);
      if(!res){
        router.push("/diary");
        return;
      }
      if (res.day.emotion) {
        router.push({ pathname: "/diary/DiaryFinal", params: { date: formattedDate } });
      } else if  ((res.audio_path) && (res.audio_path !== "empty")) {
        router.push({ pathname: "/diary/audioDiary", params: { date: formattedDate } });
      } else {
        router.push({ pathname: "/diary/textDiary", params: { date: formattedDate } });
      }
    } catch (e) {
      console.log(e);
      router.push("/home");

    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.calendarContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goToPreviousMonth}
            style={styles.arrowButton}
          >
            <Text style={styles.arrowText}>{"<"}</Text>
          </TouchableOpacity>

          <Text style={styles.monthText}>
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}월
          </Text>

          <TouchableOpacity onPress={goToNextMonth} style={styles.arrowButton}>
            <Text style={styles.arrowText}>{">"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.daysHeader}>
          {dayNames.map((day, index) => (
            <Text key={index} style={styles.dayName}>
              {day}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {generateCalendarDays().map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSelected(day) ? styles.selectedDay : null,
                isToday(day) ? styles.today : null,
              ]}
              onPress={() => onDateSelect(day)}
              disabled={day === null}
            >
              {day !== null && renderStatusIndicator(day)}

              <Text
                style={[
                  styles.dayText,
                  isSelected(day) ? styles.selectedDayText : null,
                  isToday(day) ? styles.todayText : null,
                ]}
              >
                {day !== null ? day : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={() => {
          router.push({
            pathname: "../todolist/todo",
            params: {date: today}
          });
        }}>
          <View
            style={[
              styles.divContainer,
              { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
            ]}
          >
            <Text style={{ fontSize: 16, fontFamily: "roboto" }}>
              오늘의 할 일 &gt;
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={ handleDateSelect }
        >
          <View
            style={[
              styles.divContainer,
              { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
            ]}
          >
            <Text style={{ fontSize: 16, fontFamily: "roboto" }}>
              오늘의 다이어리 &gt;
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("../collect/collect")}>
          <View
            style={[
              styles.divContainer,
              { backgroundColor: isDarkMode ? "white" : Colors.subPrimary },
            ]}
          >
            <Text style={{ fontSize: 16, fontFamily: "roboto" }}>
              다이어리 모아보기 &gt;
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
  },
  calendarContainer: {
    padding: "10%",
    marginTop: "7%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 8,
  },
  arrowButton: {
    padding: 5,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#555",
  },
  monthText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 10,
  },
  daysHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 5,
  },
  dayName: {
    width: 40,
    textAlign: "center",
    fontWeight: "bold",
    color: "#555",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 12,
    color: "#333",
    marginTop: 3,
  },
  today: {
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  todayText: {
    fontWeight: "bold",
  },
  selectedDay: {
    borderRadius: 20,
    backgroundColor: "#4a90e2",
  },
  selectedDayText: {
    color: "white",
    fontWeight: "bold",
  },

  buttonsContainer: {
    marginBottom: "10%",
    marginHorizontal: 30,
  },
  divContainer: {
    justifyContent: "space-between",
    flexDirection: "row",
    marginHorizontal: 10,
    marginVertical: 7,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 10,
    opacity: 0.7,
    borderWidth: 0.5,
    borderColor: "rgba(158, 150, 150, .5)",
  },
  navButtonText: {
    fontSize: 16,
    color: "#4d4a49",
  },
});
