import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { API_URL1 } from "../config"; // (Adjust path if needed)
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Starfield from "../../components/Starfield"; // (Adjust the path if you put it in a components folder)

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // YOUR Express Backend URL
  const handleAuth = async () => {
    try {
      if (isLogin) {
        // ---------------- REAL LOGIN ----------------
        console.log("Attempting to login...");
        const response = await axios.post(
          `${API_URL1}/login`,
          {
            email: email.toLowerCase(),
            password: password,
          },
          {
            headers: { "Bypass-Tunnel-Reminder": "true" }, // Added just in case!
          },
        );

        console.log("Login Success:", response.data);
        Alert.alert("Success", "Welcome back!");
        router.replace("/dashboard");
      } else {
        // ---------------- REAL SIGNUP ----------------
        console.log("Attempting to register...");
        const response = await axios.post(
          `${API_URL1}/`,
          {
            name: name,
            email: email.toLowerCase(),
            phone: phone,
            password: password,
          },
          {
            headers: { "Bypass-Tunnel-Reminder": "true" },
          },
        );

        console.log("Signup Success:", response.data);
        Alert.alert(
          "Account Created!",
          "You can now log in with your credentials.",
        );
        setIsLogin(true);
      }
    } catch (error) {
      console.log("🚨 RAW NETWORK ERROR:", error);

      let errorMessage = "Cannot connect to server.";

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert("Connection Error", errorMessage);
    }
  };

  return (
    <LinearGradient
      colors={["#1c103f", "#080d1a", "#080d1a", "#2d1445"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.backgroundGradient}
    >
      <Starfield />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>
              {isLogin ? "Welcome Back" : "Create Account"}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin
                ? "Log in to continue to your virtual fitting room."
                : "Sign up to start trying on clothes with AI."}
            </Text>
          </View>

          <View style={styles.card}>
            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor="#4A5568"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0300 1234567"
                    placeholderTextColor="#4A5568"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#4A5568"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#4A5568"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={handleAuth}
            >
              <LinearGradient
                colors={["#8b5cf6", "#3b82f6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                <Text style={styles.buttonText}>
                  {isLogin ? "Log In" : "Sign Up"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.toggleText}>
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <Text style={styles.toggleHighlight}>
                  {isLogin ? "Sign Up" : "Log In"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent", // 2. Made transparent to reveal the gradient
  },
  keyboardView: { flex: 1, justifyContent: "center", padding: 24 },
  headerContainer: { marginBottom: 32 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: "#A0AEC0", lineHeight: 24 },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  inputContainer: { marginBottom: 20 },
  label: { color: "#E2E8F0", fontSize: 14, fontWeight: "500", marginBottom: 8 },
  input: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 16,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "600" },
  toggleContainer: { marginTop: 24, alignItems: "center" },
  toggleText: { color: "#A0AEC0", fontSize: 14 },
  toggleHighlight: { color: "#8b5cf6", fontWeight: "600" },
});
