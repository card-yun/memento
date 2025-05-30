import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    alert("❌ 에뮬레이터에서는 푸시 알림이 작동하지 않습니다.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("푸시 알림 권한이 거부되었습니다.");
    return null;
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("✅ Expo Push Token:", token);
  return token;
}

export async function scheduleDiaryNotification(hour: number, minute: number) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "✍️ 일기 알림",
        body: "하루를 정리할 시간이에요!",
        sound: "default",
      },
      trigger: {
        // ✅ CalendarTriggerInput 형태로 작성해야 오류 없음
        // enum 형태. string아니고.
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        second: 0,
        repeats: true,
      },
    });

    console.log(`✅ 알림이 매일 ${hour}시 ${minute}분에 예약됨`);
  } catch (error) {
    console.error("❌ 알림 예약 중 오류:", error);
    throw error;
  }
}
