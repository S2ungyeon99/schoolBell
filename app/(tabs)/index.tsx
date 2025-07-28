// CombinedNoticeScreen.tsx

import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import HeaderDropdownMenu from "../../components/HeaderDropdownMenu"; // ✅ 실제 메뉴 컴포넌트
import { auth, db } from "../../firebaseConfig";
import { registerForPushNotificationsAsync } from "../../utils/registerForPushNotificationAsync";

const Tab = createMaterialTopTabNavigator();
const PAGE_SIZE = 10;

interface NoticeItem {
  nttId: string;
  subject: string;
  linkUrl: string;
  writer: string;
  hit: number;
  regDate: string;
}

interface NoticeSectionProps {
  docId: string;
  title: string;
  isDepartment?: boolean;
}

const NoticeSection = ({ docId, title, isDepartment }: NoticeSectionProps) => {
  const [allAnnouncements, setAllAnnouncements] = useState<NoticeItem[]>([]);
  const [visibleAnnouncements, setVisibleAnnouncements] = useState<NoticeItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [department, setDepartment] = useState("");
  const router = useRouter();

  const fetchAnnouncements = async () => {
    try {
      if (!refreshing) setLoading(true);
      let apiUrl = "";

      if (isDepartment) {
        const user = auth.currentUser;
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;
        const deptRef = doc(db, "department", userSnap.data().department);
        const deptSnap = await getDoc(deptRef);
        if (!deptSnap.exists()) return;
        apiUrl = deptSnap.data().apiUrl;
        setDepartment(deptSnap.data().name || "학과");
      } else {
        const docRef = doc(db, "notice", docId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return;
        apiUrl = docSnap.data().apiUrl;
      }

      const response = await fetch(apiUrl);
      const data: NoticeItem[] = await response.json();
      setAllAnnouncements(data);
      setVisibleAnnouncements(data.slice(0, PAGE_SIZE));
      setPage(1);
    } catch (err) {
      console.error(`🚨 ${title} 가져오기 실패:`, err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (loadingMore || visibleAnnouncements.length >= allAnnouncements.length) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const nextData = allAnnouncements.slice(0, nextPage * PAGE_SIZE);
    setVisibleAnnouncements(nextData);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const renderItem = ({ item }: { item: NoticeItem }) => {
    const formattedDate = item.regDate.split(" ")[0];
    const isNew = dayjs().diff(dayjs(formattedDate), "day") <= 3;

    return (
      <View style={styles.noticeItem}>
        <TouchableOpacity
          style={styles.noticeContent}
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
          <View style={styles.titleContainer}>
            <Text style={styles.noticeTitle}>{item.subject}</Text>
            {isNew && <Text style={styles.newBadge}>N</Text>}
          </View>
          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>{item.writer}</Text>
            <Text style={styles.noticeViews}> | 조회 {item.hit}</Text>
            <Text style={styles.noticeDate}>{formattedDate}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FlatList
      contentContainerStyle={styles.sectionContainer}
      data={visibleAnnouncements}
      keyExtractor={(item) => item.nttId}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={
        <View style={styles.headerWrapper}>
          {/* ✅ 오른쪽 상단 메뉴 */}
          <View style={styles.menuButtonContainer}>
            <HeaderDropdownMenu />
          </View>

          <View style={styles.bannerContainer}>
            <Image
              source={require("../../assets/images/hb_logo3.jpg")}
              style={styles.bannerImage}
              resizeMode="contain"
            />
            <Text style={styles.bannerText}>
              {"\\"} {isDepartment ? department : title}
            </Text>
          </View>
          <Image source={require("../../assets/images/hb_logo4.png")} style={styles.bannerImage2} resizeMode="cover" />
          <Text style={styles.sectionTitle}>공지사항</Text>
          <View style={styles.separator} />
        </View>
      }
      ListFooterComponent={
        loadingMore ? <ActivityIndicator size="small" color="#007AFF" /> : null
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        ) : (
          <Text style={styles.emptyText}>📭 공지가 없습니다.</Text>
        )
      }
    />
  );
};

export default function CombinedNoticeScreen() {
  useEffect(() => {
    const registerToken = async () => {
      const user = auth.currentUser;
      if (user) {
        await registerForPushNotificationsAsync(user.uid);
      }
    };
    registerToken();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "gray",
          tabBarIndicatorStyle: { backgroundColor: "#007AFF" },
          tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
          tabBarStyle: { backgroundColor: "#fff" },
        }}
      >
        <Tab.Screen
          name="학과 공지"
          children={() => <NoticeSection docId="department" title="학과 공지" isDepartment />}
        />
        <Tab.Screen
          name="장학금 공지"
          children={() => <NoticeSection docId="scholarship" title="장학금 공지" />}
        />
        <Tab.Screen
          name="학사 공지"
          children={() => <NoticeSection docId="school" title="학사 공지" />}
        />
        <Tab.Screen
          name="LIVE 공지"
          children={() => <NoticeSection docId="hbLive" title="LIVE 공지" />}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },
  menuButtonContainer: {
      top: -34,
      right: -11

  },
  bannerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 27,
    paddingTop: 20,
  },
  bannerImage: {
    width: 130,
    height: 30,
    marginRight: 8,
  },
  bannerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
    marginTop: 4
  },
  sectionTitle: {
    fontSize: 27,
    fontWeight: "700",
    lineHeight: 50,
    color: "#333",
    paddingHorizontal: 20,
  },
  separator: {
    height: 2.5,
    backgroundColor: "#333",
    borderRadius: 4,

  },
  sectionContainer: {
    paddingBottom: 20,
    backgroundColor: "#fff",
  },
  noticeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  noticeContent: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  noticeTitle: {
    fontSize: 16,
    flexShrink: 1,
  },
  newBadge: {
    marginLeft: 6,
    backgroundColor: "blue",
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 50,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  metaText: {
    fontSize: 14,
    color: "#666",
  },
  noticeViews: {
    fontSize: 14,
    color: "#888",
    flex: 1,
  },
  noticeDate: {
    fontSize: 14,
    color: "#888",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    marginTop: 10,
    textAlign: "center",
  },
  bannerImage2: {
    width: "100%",
    height: 150,
    marginBottom: 20,
    borderRadius: 4,
  },
});
