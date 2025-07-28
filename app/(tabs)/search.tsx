import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { auth, db } from "../../firebaseConfig";

type NoticeItem = {
  subject: string;
  linkUrl: string;
  regDate: string;
  writer?: string;
  hit?: number;
};

type ApiCache = {
  [category: string]: string;
};

export default function SearchScreen() {
  const router = useRouter();

  const [open, setOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("학과공지");
  const [items, setItems] = useState([
    { label: "학과공지", value: "학과공지" },
    { label: "장학금공지", value: "장학금공지" },
    { label: "학사공지", value: "학사공지" },
    { label: "LIVE공지", value: "LIVE공지" },
  ]);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<NoticeItem[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiUrlCache, setApiUrlCache] = useState<ApiCache>({});

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const RECENT_SEARCHES_KEY = "recent_searches";

  useFocusEffect(
    useCallback(() => {
      setHasSearched(false);
      setSearchResults([]);
      setSearchQuery("");
    }, [])
  );

  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (error) {
        console.error("최근 검색어 불러오기 오류:", error);
      }
    };
    loadRecentSearches();
  }, []);

  const saveRecentSearch = async (query: string) => {
    try {
      let updated = [query, ...recentSearches.filter((q) => q !== query)];
      if (updated.length > 5) {
        updated = updated.slice(0, 5);
      }
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("최근 검색어 저장 오류:", error);
    }
  };

  const removeRecentSearch = async (query: string) => {
    try {
      const updated = recentSearches.filter((q) => q !== query);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("개별 검색어 삭제 오류:", error);
    }
  };

  const clearAllRecentSearches = async () => {
    Alert.alert("전체 삭제", "최근 검색어를 모두 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
            setRecentSearches([]);
          } catch (error) {
            console.error("최근 검색어 전체 삭제 오류:", error);
          }
        },
      },
    ]);
  };

  const handleRecentSearchSelect = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const fetchApiUrl = async (category: string): Promise<string> => {
    if (apiUrlCache[category]) return apiUrlCache[category];

    let url = "";
    try {
      if (category === "학과공지") {
        const user = auth.currentUser;
        if (!user) return "";
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return "";
        const userDept = userSnap.data().department;
        const deptRef = doc(db, "department", userDept);
        const deptSnap = await getDoc(deptRef);
        if (deptSnap.exists()) {
          url = deptSnap.data().apiUrl;
        }
      } else {
        const keyMap: { [key: string]: string } = {
          "장학금공지": "scholarship",
          "학사공지": "school",
          "LIVE공지": "hbLive",
        };
        const noticeRef = doc(db, "notice", keyMap[category]);
        const noticeSnap = await getDoc(noticeRef);
        if (noticeSnap.exists()) {
          url = noticeSnap.data().apiUrl;
        }
      }
      setApiUrlCache((prev) => ({ ...prev, [category]: url }));
      return url;
    } catch (error) {
      console.error("fetchApiUrl error:", error);
      return "";
    }
  };

  const handleSearch = async (customQuery?: string) => {
    const query = customQuery || searchQuery;
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(true);
      return;
    }
    setLoading(true);
    setHasSearched(false);

    const apiUrl = await fetchApiUrl(selectedCategory);
    if (!apiUrl) {
      console.log("API URL을 찾을 수 없습니다.");
      setSearchResults([]);
      setLoading(false);
      setHasSearched(true);
      return;
    }

    try {
      const response = await fetch(apiUrl);
      const data: NoticeItem[] = await response.json();
      const filtered = data.filter(
        (item) => item.subject && item.subject.toLowerCase().includes(query.toLowerCase())
      );
      const sorted = filtered.sort(
        (a, b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime()
      );
      setSearchResults(sorted);
      setHasSearched(true);
      saveRecentSearch(query);
    } catch (error) {
      console.error("검색 오류:", error);
      setSearchResults([]);
      setHasSearched(true);
    }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f2f2f2" }}>
      <View style={{ backgroundColor: "#fff", padding: 16 }}>
        <DropDownPicker
          open={open}
          value={selectedCategory}
          items={items}
          setOpen={setOpen}
          setValue={setSelectedCategory}
          setItems={setItems}
          containerStyle={{ marginBottom: 16 }}
          placeholder="카테고리를 선택하세요"
        />
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="검색어를 입력하세요"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity onPress={() => handleSearch()} style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {!hasSearched && recentSearches.length > 0 && (
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>최근 검색어</Text>
            <TouchableOpacity onPress={clearAllRecentSearches}>
              <Ionicons name="trash" size={20} color="#0a7fad" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        {!hasSearched && (
          <FlatList
            data={recentSearches}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.recentRow}>
                <TouchableOpacity
                  onPress={() => handleRecentSearchSelect(item)}
                  style={styles.recentItem}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeRecentSearch(item)}>
                  <Ionicons name="close" size={20} color="gray" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        {loading && <ActivityIndicator size="large" style={{ marginVertical: 16 }} />}

        {hasSearched && searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  router.push(`/notice/noticeDetail?linkUrl=${encodeURIComponent(item.linkUrl)}`)
                }
                style={styles.resultItemWrapper}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                    <Text style={{ fontSize: 16, flexShrink: 1 }}>{item.subject}</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={{ fontSize: 14, color: "#666" }}>{item.writer}</Text>
                    <Text style={{ fontSize: 14, color: "#888", flex: 1 }}> | 조회 {item.hit}</Text>
                    <Text style={{ color: "#666" }}>{dayjs(item.regDate).format("YYYY-MM-DD")}</Text>
                  </View>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {hasSearched && !loading && searchResults.length === 0 && (
          <Text style={{ marginTop: 16 }}>검색 결과가 없습니다.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
  },
  searchButton: {
    backgroundColor: "#0a7fad",
    padding: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  arrow: {
    fontSize: 20,
    color: "#aaa",
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    alignItems: "center",
  },
  recentTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  recentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    paddingVertical: 8,
    marginBottom: 8,
    width: "100%",
  },
  recentItem: {
    flex: 1,
  },
  resultItemWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
});
