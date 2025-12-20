// src/screens/RegisterScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import Button from "../components/Button";
import InputField from "../components/InputField";
import Loader from "../components/Loader";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY } from "../utils/constants";
import { userAPI } from "../utils/api";

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    type: "athlete",
  });

  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Generate a random email for testing
  const generateRandomEmail = () => {
    const randomNum = Math.floor(Math.random() * 10000);
    const randomEmail = `test${randomNum}@example.com`;
    setFormData((prev) => ({ ...prev, email: randomEmail }));
    setEmailError("");
  };

  const handleRegister = async () => {
    const { name, email, password, confirmPassword, type } = formData;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    // Clear previous email error
    setEmailError("");

    setLoading(true);

    try {
      // Prepare registration data
      const registrationData = {
        name: name.trim(),
        email: email.trim().toLowerCase(), // Convert to lowercase
        password: password.trim(),
        type: type,
      };

      // API call to register endpoint
      const response = await userAPI.register(registrationData);

      Alert.alert(
        "Success",
        "Registration successful! Please login with your new account.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Registration error:", error.message);

      // Handle specific error messages
      if (error.message.includes("Email already exists")) {
        setEmailError(
          "This email is already registered. Please use a different email."
        );
        Alert.alert(
          "Email Already Exists",
          "This email address is already registered. Would you like to use a random email instead?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Use Random Email",
              onPress: generateRandomEmail,
            },
          ]
        );
      } else if (error.message.includes("Missing required field")) {
        Alert.alert("Error", "Please fill in all required fields.");
      } else if (error.message.includes("Failed to fetch")) {
        Alert.alert(
          "Connection Error",
          "Cannot connect to the server. Please make sure the backend is running on http://localhost:5000"
        );
      } else {
        Alert.alert(
          "Registration Failed",
          error.message || "An error occurred. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    // Clear email error when user starts typing
    if (field === "email") {
      setEmailError("");
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join our runner safety community
            </Text>
          </View>

          <View style={styles.form}>
            <InputField
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => updateFormData("name", value)}
              icon="account"
            />

            <View style={styles.emailContainer}>
              <InputField
                label="Email"
                placeholder="Enter your email"
                value={formData.email}
                onChangeText={(value) => updateFormData("email", value)}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="email"
                error={emailError}
              />
              <TouchableOpacity
                style={styles.randomEmailButton}
                onPress={generateRandomEmail}
              >
                <Icon name="dice-5" size={16} color={COLORS.primary} />
                <Text style={styles.randomEmailText}>Use random email</Text>
              </TouchableOpacity>
            </View>

            <InputField
              label="Password"
              placeholder="Create a password (min. 6 characters)"
              value={formData.password}
              onChangeText={(value) => updateFormData("password", value)}
              secureTextEntry
              icon="lock"
            />

            <InputField
              label="Confirm Password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData("confirmPassword", value)}
              secureTextEntry
              icon="lock-check"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Account Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === "athlete" && styles.typeButtonActive,
                  ]}
                  onPress={() => updateFormData("type", "athlete")}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === "athlete" &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    Athlete
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === "coach" && styles.typeButtonActive,
                  ]}
                  onPress={() => updateFormData("type", "coach")}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === "coach" && styles.typeButtonTextActive,
                    ]}
                  >
                    Coach
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.noteBox}>
              <Icon name="information" size={16} color={COLORS.primary} />
              <Text style={styles.noteText}>
                Note: Coach ID is optional for athletes. You can add it later in
                your profile.
              </Text>
            </View>

            <Button
              title="Create Account"
              onPress={handleRegister}
              style={styles.registerButton}
              loading={loading}
              disabled={loading}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <Button
                title="Sign In"
                onPress={() => navigation.goBack()}
                type="text"
                textStyle={styles.signInText}
              />
            </View>
          </View>

          <View style={styles.successInfo}>
            <Icon name="check-circle" size={20} color={COLORS.safe} />
            <Text style={styles.successInfoText}>
              Backend connected successfully! Try these test emails:
            </Text>
            <Text style={styles.testEmails}>
              • coach.smith@example.com (already registered){"\n"}•
              coach.johnson@example.com (already registered){"\n"}• Or use the
              "Use random email" button
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Loader visible={loading} message="Creating account..." />
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 0,
    padding: 8,
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
  emailContainer: {
    marginBottom: 8,
  },
  randomEmailButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 12,
  },
  randomEmailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    marginBottom: 8,
    fontWeight: "500",
  },
  typeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.primary + "10",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  noteText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  registerButton: {
    marginTop: 8,
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
  signInText: {
    color: COLORS.primary,
  },
  successInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.safe + "10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.safe + "30",
  },
  successInfoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 4,
  },
  testEmails: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});

export default RegisterScreen;
