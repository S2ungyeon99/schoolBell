// FavoriteNotice.tsx
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

type FavoriteNoticeItem = {
  nttId: string;
  subject: string;
  writer: string;
  hit: number;
  regDate: string;
  linkUrl: string;
};

export default function FavoriteNotice() {
  const [favoriteList, setFavoriteList] = useState<FavoriteNoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const favorites = (userSnap.data().favoriteNotices || {}) as Record<
          string,
          FavoriteNoticeItem
        >;
        setFavoriteList(Object.values(favorites));
      } else {
        setFavoriteList([]);
      }
    } catch (err) {
      console.error("🚨 즐겨찾기 목록 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [])
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : favoriteList.length > 0 ? (
        <ScrollView>
          {favoriteList.map((item) => {
            const formattedDate = item.regDate ? item.regDate.split(" ")[0] : "";
            const isNew =
              item.regDate && dayjs().diff(dayjs(formattedDate), "day") <= 3;
            return (
              <TouchableOpacity
                key={item.nttId}
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/notice/noticeDetail",
                    params: {
                      nttId: item.nttId,
                      linkUrl: item.linkUrl,
                      subject: item.subject,
                      writer: item.writer,
                      hit: item.hit.toString(),
                      regDate: item.regDate,
                    },
                  })
                }
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.subject}</Text>
                  {isNew && <Text style={styles.newBadge}>NEW</Text>}
                </View>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{item.writer}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="eye-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{item.hit}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={14} color="#666" />
                    <Text style={styles.metaText}>{formattedDate}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={{ alignItems: "center", marginTop: 170 }}>
          <Ionicons name="bookmark-outline" size={40} color="#888" />
          <Text style={styles.emptyText}>즐겨찾기한 공지가 없습니다.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#333", flex: 1 },
  newBadge: {
    backgroundColor: "#007AFF",
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  cardMeta: { flexDirection: "row", justifyContent: "space-between" },
  metaItem: { flexDirection: "row", alignItems: "center" },
  metaText: { marginLeft: 4, fontSize: 13, color: "#666" },
  emptyText: { fontSize: 18, textAlign: "center", marginTop: 16, color: "#888" },
});
