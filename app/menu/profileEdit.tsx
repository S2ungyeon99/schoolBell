import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

type Department = {
  id: string;
  name: string;
};

export default function ProfileEditScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setNickname(data.nickname || "");
        setDepartment(data.department || "");
      }
    } catch (error) {
      console.error("프로필 정보를 가져오지 못했습니다.", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const deptCollection = collection(db, "department");
      const deptSnapshot = await getDocs(deptCollection);
      const deptList: Department[] = deptSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || "",
      }));
      setDepartments(deptList);
    } catch (error) {
      console.error("학과 목록을 가져오지 못했습니다.", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUserProfile();
      await fetchDepartments();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        nickname: nickname,
        department: department,
      });
      Alert.alert("성공", "프로필이 업데이트되었습니다.");
      router.back();
    } catch (error) {
      console.error("프로필 업데이트 실패", error);
      Alert.alert("오류", "프로필 업데이트에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>프로필 편집</Text>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>닉네임</Text>
        <TextInput
          style={styles.input}
          value={nickname}
          onChangeText={setNickname}
          placeholder="닉네임 입력"
        />
      </View>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>학과 선택</Text>
        <Picker
          selectedValue={department}
          onValueChange={(itemValue) => setDepartment(itemValue)}
          style={styles.picker}
        >
          {departments.map((dept) => (
            <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
          ))}
        </Picker>
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>저장</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 24 },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 16, marginBottom: 8, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 12,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
