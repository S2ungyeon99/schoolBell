import { doc, getDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";


export default function KeywordScreen() {
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 유저 문서에서 기존 키워드 불러오기
  useEffect(() => {
    const fetchKeywords = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const existing = userSnap.data().keywords as string[] | undefined;
          setKeywords(existing ?? []);
        }
      } catch (error) {
        console.error("키워드 불러오기 실패", error);
      }
    };
    fetchKeywords();
  }, []);

  // 키워드 저장 (기존 목록과 병합)
  const handleSaveKeywords = async (): Promise<void> => {
    const newKeywords = keywordInput
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter((k) => k !== "");

    if (newKeywords.length === 0) {
      Alert.alert("오류", "키워드를 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const updatedKeywords = Array.from(new Set([...keywords, ...newKeywords]));
      await updateDoc(userRef, { keywords: updatedKeywords });
      setKeywords(updatedKeywords);
      setKeywordInput("");
      Alert.alert("완료", "키워드가 저장되었습니다.");
    } catch (error) {
      console.error("키워드 저장 실패", error);
      Alert.alert("오류", "키워드 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 개별 키워드 삭제 처리
  const handleRemoveKeyword = async (keyword: string): Promise<void> => {
    const updated = keywords.filter((k) => k !== keyword);
    setKeywords(updated);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { keywords: updated });
    } catch (error) {
      console.error("키워드 삭제 실패", error);
    }
  };

  const renderKeywordItem: ListRenderItem<string> = ({ item }) => (
    <View style={styles.keywordItem}>
      <Text style={styles.keywordText}>{item}</Text>
      <TouchableOpacity onPress={() => handleRemoveKeyword(item)}>
        <Text style={styles.removeText}>X</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>키워드 등록</Text>
      <Text style={styles.subtitle}>
        등록한 키워드가 포함된 새 공지가 올라오면 알림을 받습니다.
      </Text>
      <TextInput
        style={styles.input}
        placeholder="키워드를 입력하세요. (여러 개일 경우 쉼표 또는 줄바꿈으로 구분)"
        value={keywordInput}
        onChangeText={setKeywordInput}
        multiline
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSaveKeywords}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "저장 중..." : "키워드 저장"}
        </Text>
      </TouchableOpacity>
      <Text style={styles.currentTitle}>등록된 키워드</Text>
      {keywords.length > 0 ? (
        <FlatList
          data={keywords}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderKeywordItem}
        />
      ) : (
        <Text style={styles.noKeywords}>등록된 키워드가 없습니다.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  currentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  noKeywords: {
    fontSize: 16,
    color: "#888",
  },
  keywordItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 4,
  },
  keywordText: {
    fontSize: 16,
  },
  removeText: {
    fontSize: 16,
    color: "red",
    marginLeft: 8,
  },
});
