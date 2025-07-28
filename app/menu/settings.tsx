import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  auth,
  db
} from "../../firebaseConfig";

function AppInfoSection() {
  return (
    <View style={styles.appInfoContainer}>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>앱 버전</Text>
        <Text style={styles.infoLabel}>v1.0.0</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>개발자 연락처</Text>
        <Text style={styles.infoLabel}>20217166@edu.hanbat.ac.kr</Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [nickname, setNickname] = useState("");
  const [departmentName, setDepartmentName] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setNickname(data.nickname || "");
        if (data.department) {
          const deptRef = doc(db, "department", data.department);
          const deptSnap = await getDoc(deptRef);
          if (deptSnap.exists()) {
            setDepartmentName(deptSnap.data().name || "");
          }
        }
      }
    };
    fetchUserProfile();
  }, []);

  const handleProfileEdit = () => {
    router.push("./profileEdit");
  };

  const handleChangePassword = () => {
    router.push("./passwordChange");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("로그아웃 후 auth.currentUser:", auth.currentUser);
      await AsyncStorage.removeItem("autoLoginEmail");
      await AsyncStorage.removeItem("autoLoginPassword");
      router.replace("/");
    } catch (error) {
      console.error("handleLogout 에러 발생", error);
      Alert.alert("오류", "로그아웃에 실패했습니다.");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>설정</Text>

      {nickname ? (
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>환영합니다, {nickname}님!</Text>
          {departmentName ? (
            <Text style={styles.departmentText}>{departmentName}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>계정 및 프로필 관리</Text>
      </View>
      <View style={styles.section}>
        <TouchableOpacity style={styles.itemRow} onPress={handleProfileEdit}>
          <Text style={styles.itemLabel}>프로필 편집</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.itemRow}
          onPress={handleChangePassword}
        >
          <Text style={styles.itemLabel}>비밀번호 변경</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>앱 정보</Text>
      </View>
      <View style={styles.section}>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>앱 버전</Text>
          <Text style={styles.itemLabel}>v1.0.0</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>개발자 연락처</Text>
          <Text style={styles.itemLabel}>20217166@edu.hanbat.ac.kr</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  welcomeContainer: {
    backgroundColor: "#e0f7fa",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#00796b",
  },
  departmentText: {
    fontSize: 16,
    color: "#00796b",
    marginTop: 4,
  },
  sectionHeader: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  section: { paddingHorizontal: 16 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemLabel: { fontSize: 16, color: "#333" },
  appInfoContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#eee",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  infoValue: { fontSize: 16, color: "#666" },
  logoutButton: {
    backgroundColor: "#ccc",
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 32,
    marginHorizontal: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
});
