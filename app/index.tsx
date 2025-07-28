import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState<boolean>(true);

  useEffect(() => {
    checkAutoLogin();
  }, []);

  useEffect(() => {
    if (!isCheckingLogin && isLoggedIn) {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn, isCheckingLogin]);

  const checkAutoLogin = async () => {
    const savedEmail = await AsyncStorage.getItem("autoLoginEmail");
    const savedPassword = await AsyncStorage.getItem("autoLoginPassword");

    if (savedEmail && savedPassword) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          savedEmail,
          savedPassword
        );
        console.log("✅ 자동 로그인:", userCredential.user.uid);
        setIsLoggedIn(true);
      } catch (error: any) {
        console.log("❌ 자동 로그인 실패:", error.message);
        await AsyncStorage.multiRemove(["autoLoginEmail", "autoLoginPassword"]);
      }
    }
    setIsCheckingLogin(false);
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem("autoLoginEmail", email);
      await AsyncStorage.setItem("autoLoginPassword", password);

      Alert.alert("로그인 성공!", "환영합니다.");
      setIsLoggedIn(true);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("로그인 실패", error.message);
    }
  };

  if (isCheckingLogin) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0a7fad" />
        <Text>로그인 상태 확인 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/hb_logo.jpg")}
        style={styles.logo}
      />
      <TextInput
        style={styles.input}
        placeholder="아이디를 입력해주세요."
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호를 입력해주세요"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>로그인</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push("/auth/signup1")}>
        <Text style={styles.signupText}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 180,
    height: 206.52,
    marginBottom:10
  },
  input: {
    width: "80%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 14,
  },
  loginButton: {
    width: "80%",
    backgroundColor: "#0a7fad",
    paddingVertical: 15,
    borderRadius: 4,
    alignItems: "center",
    marginBottom: 10,
  },
  loginText: {
    color: "#fff",
    fontSize: 14,
  },
  signupText: {
    color: "#007AFF",
    fontSize: 14,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
