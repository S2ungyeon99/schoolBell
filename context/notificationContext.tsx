import * as Notifications from "expo-notifications";
import { onAuthStateChanged } from "firebase/auth";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationAsync";

interface NotificationContextType {
  expoToken: string | null;
}

const NotificationContext = createContext<NotificationContextType>({
  expoToken: null,
});

export const useNotification = () => useContext(NotificationContext);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [expoToken, setExpoToken] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await registerForPushNotificationsAsync(user.uid);
        if (token) setExpoToken(token);
      }
    });

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received in context:", notification);
    });

    return () => {
      unsubscribeAuth();
      subscription.remove();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ expoToken }}>
      {children}
    </NotificationContext.Provider>
  );
};
