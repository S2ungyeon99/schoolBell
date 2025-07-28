// NoticeDetail.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import { auth, db } from "../../firebaseConfig";

interface FavoriteNoticeItem {
  nttId: string;
  linkUrl: string;
  subject: string;
  writer: string;
  hit: number;
  regDate: string;
}
interface UserData {
  favoriteNotices?: Record<string, FavoriteNoticeItem>;
}

export default function NoticeDetail() {
  const params = useLocalSearchParams();

  const nttId = typeof params.nttId === "string" ? params.nttId : "";
  const linkUrl = typeof params.linkUrl === "string" ? params.linkUrl : "";
  const subject = typeof params.subject === "string" ? params.subject : "";
  const writer = typeof params.writer === "string" ? params.writer : "";
  const hit = Number(params.hit) || 0;
  const regDate = typeof params.regDate === "string" ? params.regDate : "";

  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const fullUrl = `https://www.hanbat.ac.kr${linkUrl}`;

  const fetchFavoriteStatus = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      setIsFavorite(false);
      return;
    }
    const userData = userSnap.data() as UserData;
    const favorites = userData.favoriteNotices || {};
    setIsFavorite(!!favorites[nttId]);
  };

  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // 버튼 애니메이션
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    let currentFavorites: Record<string, FavoriteNoticeItem> = {};
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserData;
      currentFavorites = userData.favoriteNotices || {};
    }

    if (isFavorite) {
      delete currentFavorites[nttId];
    } else {
      currentFavorites[nttId] = { nttId, linkUrl, subject, writer, hit, regDate };
    }

    if (userSnap.exists()) {
      await updateDoc(userRef, { favoriteNotices: currentFavorites });
    } else {
      await setDoc(userRef, { favoriteNotices: currentFavorites });
    }

    setIsFavorite(!isFavorite);
  };

  useEffect(() => {
    fetchFavoriteStatus();
  }, []);

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />}
      <WebView source={{ uri: fullUrl }} onLoad={() => setLoading(false)} />
      <Animated.View style={[styles.fab, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity onPress={toggleFavorite} activeOpacity={0.8}>
          <Ionicons name={isFavorite ? "star" : "star-outline"} size={28} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007AFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
