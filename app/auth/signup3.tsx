import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";

type Signup3Params = {
  email?: string | string[];
  password?: string | string[];
  nickname?: string | string[];
};

type Department = {
  id: string;
  name: string;
};

export default function SignupStep3() {
  const router = useRouter();
  const params = useLocalSearchParams<Signup3Params>();

  // ✅ params 안전하게 추출
  const email =
    typeof params.email === "string"
      ? params.email
      : Array.isArray(params.email)
      ? params.email[0]
      : "";
  const password =
    typeof params.password === "string"
      ? params.password
      : Array.isArray(params.password)
      ? params.password[0]
      : "";
  const nickname =
    typeof params.nickname === "string"
      ? params.nickname
      : Array.isArray(params.nickname)
      ? params.nickname[0]
      : "";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isButtonEnabled, setIsButtonEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (!email || !password || !nickname) {
      Alert.alert("회원가입 오류", "입력 정보가 누락되었습니다.");
      router.replace("/auth/signup1" as any);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, "department"));
      const list = snap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setDepartments(list);
    } catch (err) {
      Alert.alert("오류", "학과 목록 불러오기 실패");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    setIsButtonEnabled(!!selectedDeptId && !isLoading);
  }, [selectedDeptId, isLoading]);

  const handleSignup = async () => {
    if (!email || !password || !nickname) return;
    if (!selectedDeptId) {
      Alert.alert("학과 선택", "학과를 선택해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const uc = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = uc.user;

      await setDoc(doc(db, "users", user.uid), {
        nickname,
        department: selectedDeptId,
        createdAt: serverTimestamp(),
      });

      Alert.alert("회원가입 완료", "이제 로그인하세요!", [
        {
          text: "확인",
          onPress: () => router.replace("/"),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert("회원가입 실패", err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/hb_logo2.jpg")}
        style={styles.logo}
      />
      <Text style={styles.title}>소속 학과를 선택하세요 :)</Text>
      <Text style={styles.subtitle}>올바른 학과를 선택해주세요.</Text>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color="#0a7fad"
          style={{ marginVertical: 20 }}
        />
      ) : (
        <Picker
          selectedValue={selectedDeptId}
          onValueChange={(value) => setSelectedDeptId(value)}
          style={styles.picker}
        >
          <Picker.Item label="학과를 선택하세요" value={null} />
          {departments.map((dept) => (
            <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
          ))}
        </Picker>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          (!selectedDeptId || isLoading) && styles.disabledButton,
        ]}
        onPress={handleSignup}
        disabled={!selectedDeptId || isLoading}
      >
        <Text style={styles.buttonText}>회원가입 완료</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  logo: {
    width: 55,
    height: 55,
    marginBottom: 10,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    textAlign: "left",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "left",
    marginBottom: 30,
  },
  picker: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    width: "100%",
    backgroundColor: "#0a7fad",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});
