import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { doc, setDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../firebaseConfig";

export async function registerForPushNotificationsAsync(userId: string): Promise<string | undefined> {
  console.log("📱 Platform:", Platform.OS, "/ isDevice:", Device.isDevice);

  if (!Device.isDevice) {
    console.warn("[Push] Must use physical device for Push Notifications");
    return;
  }

  // 1. Request or get existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("[Push] Failed to get push token for push notification!");
    return;
  }

  // 2. Get the Expo push token
  let token: string | undefined;
  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    token = tokenResponse.data;
    console.log("[Push] Expo push token:", token);
  } catch (error) {
    console.error("[Push] Error fetching push token:", error);
    return;
  }

  // 3. Save the token to Firestore
  if (userId) {
    try {
      await setDoc(doc(db, "users", userId), { expoPushToken: token }, { merge: true });
      console.log("[Push] Push token saved to Firestore");
    } catch (error) {
      console.error("[Push] Error saving push token to Firestore:", error);
    }
  } else {
    console.warn("[Push] No userId provided, skipping Firestore save");
  }

  // 4. Android-specific channel configuration
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}
