// src/screens/LoginScreen.js
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import Button from "../components/Button";
import InputField from "../components/InputField";
import Loader from "../components/Loader";
import { COLORS, TYPOGRAPHY } from "../utils/constants";
import { userAPI } from "../utils/api";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await userAPI.login({
        email: email.trim(),
        password: password.trim(),
      });

      await login(response.token, {
        id: response.id,
        name: response.name,
        email: response.email,
        type: response.type,
        coach_id: response.coach_id,
      });

      Alert.alert("Success", "Login successful!");
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error.message || "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={{
                  uri: "https://img.icons8.com/color/96/000000/running.png",
                }}
                style={styles.logo}
              />
            </View>
            <Text style={styles.title}>Runner Safety</Text>
            <Text style={styles.subtitle}>Injury Prediction System</Text>
          </View>

          <View style={styles.form}>
            <InputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="email"
            />

            <InputField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              icon="lock"
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              style={styles.loginButton}
              loading={loading}
              disabled={loading}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Button
                title="Sign Up"
                onPress={() => navigation.navigate("Register")}
                type="text"
                textStyle={styles.signUpText}
              />
            </View>
          </View>

          <View style={styles.demoInfo}>
            <Text style={styles.demoText}>
              Note: Connect to localhost:5000 for API access
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Loader visible={loading} message="Signing in..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight + "30",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 48,
    height: 48,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  form: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 24,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButton: {
    marginTop: 24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  signUpText: {
    color: COLORS.primary,
  },
  demoInfo: {
    marginTop: 24,
    padding: 12,
    backgroundColor: COLORS.primaryLight + "20",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  demoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
});

export default LoginScreen;
