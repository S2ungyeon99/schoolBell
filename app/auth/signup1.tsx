import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignupStep1() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  // 이메일 형식 유효성 검사
  useEffect(() => {
    const emailRegex = /^[^\s@]+@edu\.hanbat\.ac\.kr$/;
    setIsEmailValid(emailRegex.test(email));
  }, [email]);

  // 비밀번호 조건 검사
  useEffect(() => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
    setIsPasswordValid(passwordRegex.test(password));
  }, [password]);

  // 비밀번호 확인 일치 여부
  useEffect(() => {
    setIsPasswordMatch(password === confirmPassword && password.length > 0);
  }, [password, confirmPassword]);

  // 전체 버튼 활성화 조건
  useEffect(() => {
    setIsButtonEnabled(isEmailValid && isPasswordValid && isPasswordMatch);
  }, [isEmailValid, isPasswordValid, isPasswordMatch]);

  // 다음 단계로 이동
  const goToNextStep = () => {
    if (!isButtonEnabled) {
      Alert.alert("입력 오류", "모든 조건을 충족해야 합니다.");
      return;
    }

    router.push({
      pathname: "/auth/signup2",
      params: { email, password },
    } as any); // 타입 오류 회피
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/hb_logo2.jpg")}
          style={styles.logo}
        />
        <Text style={styles.title}>입력하신 계정으로</Text>
        <Text style={styles.title}>schoolBell 가입을 진행합니다.</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="학교이메일 주소"
        onChangeText={setEmail}
        value={email}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 (영문+숫자 8~16자)"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호 확인"
        secureTextEntry
        onChangeText={setConfirmPassword}
        value={confirmPassword}
      />

      <TouchableOpacity
        style={[styles.button, !isButtonEnabled && styles.disabledButton]}
        onPress={goToNextStep}
        disabled={!isButtonEnabled}
      >
        <Text style={styles.buttonText}>계속하기</Text>
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
    paddingTop: 50,
  },
  header: {
    width: "100%",
    marginBottom: 20,
  },
  logo: {
    width: 55,
    height: 55,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "left",
    color: "#333",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    alignSelf: "center",
  },
  button: {
    width: "100%",
    backgroundColor: "#0a7fad",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});
