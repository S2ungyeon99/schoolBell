import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Signup2Params = {
  email?: string;
  password?: string;
};

export default function SignupStep2() {
  const router = useRouter();
  const { email, password } = useLocalSearchParams<Signup2Params>();

  const [nickname, setNickname] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const isButtonEnabled = nickname.length >= 2 && nickname.length <= 10;

  const handleNext = () => {
    if (!isButtonEnabled) {
      Alert.alert("입력 오류", "닉네임은 2~10자 사이여야 합니다.");
      return;
    }

    router.push(
      `/auth/signup3?email=${encodeURIComponent(email ?? "")}&password=${encodeURIComponent(
        password ?? ""
      )}&nickname=${encodeURIComponent(nickname)}` as any
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../../assets/images/hb_logo2.jpg")} style={styles.logo} />
        <Text style={styles.title}>닉네임을 설정하세요 :)</Text>
        <Text style={styles.subtitle}>닉네임은 2~10자 이내로 입력해주세요.</Text>
      </View>

      <TextInput
        style={[
          styles.input,
          { borderBottomColor: isFocused ? "#0a7fad" : "#ccc" },
        ]}
        placeholder="닉네임을 입력해주세요"
        placeholderTextColor="#ccc"
        value={nickname}
        onChangeText={setNickname}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <TouchableOpacity
        style={[styles.button, !isButtonEnabled && styles.disabledButton]}
        onPress={handleNext}
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
    paddingTop: 20,
  },
  header: {
    width: "100%",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  logo: {
    width: 55,
    height: 55,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 100,
  },
  input: {
    width: "100%",
    height: 50,
    borderBottomWidth: 2,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "transparent",
    alignSelf: "center",
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
