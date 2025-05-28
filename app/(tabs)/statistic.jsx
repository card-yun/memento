import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { getStatisticsByYear } from "../../utils/stat";

import { useDarkMode } from "../../contexts/DarkModeContext";

export default function Stat() {
  const { isDarkMode } = useDarkMode();

  const [selectedYear, setSelectedYear] = useState(2025);

  const [statistics, setStatistics] = useState({
    totalDiaries: 0,
    emotionData: {
      neutral: 0,
      joy: 0,
      anger: 0,
      sadness: 0,
      tired: 0,
    },
  });

  const [monthlyData, setMonthlyData] = useState(
    Array(12)
      .fill()
      .map(() => Array(31).fill(null))
  );
  // 로딩 및 에러 상태 추가
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 월 이름 리스트
  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  // 감정에 따른 색상 매핑
  const emotionColors = {
    joy: "#FFCBEB",
    neutral: "#FFDCC4",
    sadness: "#CAD2F8",
    tired: "#D8B1D6",
    anger: "#FF6347",
    null: "#FFFFFF",
  };

  // 감정 이름 매핑
  const emotionNames = {
    neutral: "중립",
    joy: "기쁨",
    anger: "화남",
    sadness: "슬픔",
    tired: "지침",
  };

  // 연도 변경 함수
  const changeYear = (delta) => {
    setSelectedYear(selectedYear + delta);
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getStatisticsByYear(selectedYear);
          setStatistics({
            totalDiaries: data?.totalDiaries ?? 0,
            emotionData: data?.emotionData ?? {
              happy: 0,
              anger: 0,
              neutral: 0,
              sad: 0,
              tired: 0,
            },
          });
          setMonthlyData(
            data?.monthlyEmotionData ??
              Array(12)
                .fill()
                .map(() => Array(31).fill(null))
          );
        } catch (error) {
          console.error("통계 불러오기 실패:", error);
          setError("통계 데이터를 불러오는데 실패했습니다. 다시 시도해주세요.");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [selectedYear])
  );

  // API 호출 함수
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getStatisticsByYear(selectedYear);

        setStatistics({
          totalDiaries: data?.totalDiaries ?? 0,
          emotionData: data?.emotionData ?? {
            joy: 0,
            anger: 0,
            neutral: 0,
            sadness: 0,
            tired: 0,
          },
        });

        setMonthlyData(
          data?.monthlyEmotionData ??
            Array(12)
              .fill()
              .map(() => Array(31).fill(null))
        );
      } catch (error) {
        console.error("통계 불러오기 실패:", error);
        setError("통계 데이터를 불러오는데 실패했습니다. 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.header}>통계</Text>

        {loading ? (
          <Text style={styles.message}>데이터를 불러오는 중...</Text>
        ) : error ? (
          <Text style={styles.errorMessage}>{error}</Text>
        ) : (
          <>
            {/* 총 일기 개수 */}
            <View style={styles.statisticItem}>
              <Text style={styles.statisticLabel}>총 일기 개수:</Text>
              <Text style={styles.statisticValue}>
                {statistics.totalDiaries}개
              </Text>
            </View>

            {/* 감정 트래커 */}
            <Text style={styles.sectionTitle}>감정 트래커</Text>
            <View
              style={[
                styles.emotionTracker,
                {
                  backgroundColor: isDarkMode
                    ? "#efefef"
                    : "rgba(255,230,213, 0.5)",
                },
              ]}
            >
              {Object.entries(emotionNames).map(([key, name]) => (
                <View key={key} style={styles.emotionItem}>
                  <View
                    style={[
                      styles.emotionBox,
                      { backgroundColor: emotionColors[key] },
                    ]}
                  />
                  <Text style={styles.emotionText}>{name}</Text>
                  <Text style={styles.emotionCount}>
                    {statistics.emotionData[key]}개
                  </Text>
                </View>
              ))}
            </View>

            {/* 연간 트래커 */}
            <View style={styles.yearSelector}>
              <TouchableOpacity
                onPress={() => changeYear(-1)}
                style={styles.yearArrow}
              >
                <Text style={styles.yearArrowText}>{"<"}</Text>
              </TouchableOpacity>

              <Text style={styles.yearText}>{selectedYear}년</Text>

              <TouchableOpacity
                onPress={() => changeYear(1)}
                style={styles.yearArrow}
              >
                <Text style={styles.yearArrowText}>{">"}</Text>
              </TouchableOpacity>
            </View>

            {/* 연간 감정 트래커 표 */}
            <View style={styles.tableContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                {/* 표 헤더 (월) */}
                <View style={styles.tableRow}>
                  <View
                    style={[
                      styles.tableHeaderCell,
                      {
                        backgroundColor: isDarkMode
                          ? "#efefef"
                          : "rgba(255,230,213, 0.5)",
                      },
                    ]}
                  >
                    <Text style={styles.tableHeaderText}>날짜</Text>
                  </View>
                  {monthNames.map((month, index) => (
                    <View
                      key={index}
                      style={[
                        styles.tableHeaderCell,
                        {
                          backgroundColor: isDarkMode
                            ? "#efefef"
                            : "rgba(255,230,213, 0.5)",
                        },
                      ]}
                    >
                      <Text style={styles.tableHeaderText}>{month}</Text>
                    </View>
                  ))}
                </View>

                {/* 표 행 (일) */}
                {Array.from({ length: 31 }, (_, dayIndex) => (
                  <View key={dayIndex} style={styles.tableRow}>
                    {/* 날짜 셀 */}
                    <View
                      style={[
                        styles.tableDateCell,
                        {
                          backgroundColor: isDarkMode
                            ? "#efefef"
                            : "rgba(255,230,213, 0.5)",
                        },
                      ]}
                    >
                      <Text style={styles.tableDateText}>{dayIndex + 1}</Text>
                    </View>

                    {/* 각 월의 해당 일 데이터 */}
                    {Array.from({ length: 12 }, (_, monthIndex) => {
                      const emotion = monthlyData[monthIndex][dayIndex];
                      const isValidDay =
                        dayIndex <
                        new Date(selectedYear, monthIndex + 1, 0).getDate();

                      return (
                        <View
                          key={monthIndex}
                          style={[
                            styles.tableCell,
                            {
                              backgroundColor: isValidDay
                                ? emotionColors[emotion]
                                : "#F5F5F5",
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
    padding: 20,
  },
  scrollContainer: {
    paddingLeft: 15,
    paddingRight: 15,
    width: "100%",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  statisticItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statisticLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 5,
  },
  statisticValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: "red",
  },
  // 감정 트래커 스타일
  emotionTracker: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 10,
  },
  emotionItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "20%",
  },
  emotionBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    marginRight: 2,
  },
  emotionText: {
    fontSize: 11,
    marginRight: 2,
  },
  emotionCount: {
    fontSize: 11,
    fontWeight: "bold",
  },
  // 연도 선택기 스타일
  yearSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 13,
  },
  yearArrow: {
    padding: 8,
  },
  yearArrowText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  yearText: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
  },
  // 표 스타일
  tableContainer: {
    width: "100%",
    marginBottom: 20,
    overflow: "scroll",
  },
  tableRow: {
    flexDirection: "row",
    height: 15,
  },
  tableHeaderCell: {
    width: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  tableDateCell: {
    width: 26,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
  },
  tableDateText: {
    fontSize: 10,
  },
  tableCell: {
    width: 26,
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
  },
});
