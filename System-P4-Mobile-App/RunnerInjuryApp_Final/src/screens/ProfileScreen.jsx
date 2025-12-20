// src/screens/ProfileScreen.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
} from "react-native";
import Button from "../components/Button";
import Loader from "../components/Loader";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY } from "../utils/constants";
import { userAPI, athleteAPI, coachAPI, sessionAPI } from "../utils/api";

const ProfileScreen = ({ navigation }) => {
  const { userData, logout, updateUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    injuryWarnings: 0,
    avgSafetyScore: 0,
  });

  useEffect(() => {
    if (userData) {
      fetchUserProfile();
    }
  }, [userData]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // Debug: Log current auth state
      console.log("👤 Fetching profile for user:", userData);

      // First, try to get basic user data without making additional API calls
      setProfileData(userData);

      // Then try to fetch additional data if needed
      if (userData.type === "athlete") {
        try {
          console.log(`👟 Fetching athlete ${userData.id}...`);
          const athleteData = await athleteAPI.getOne(userData.id);
          console.log("✅ Athlete data:", athleteData);
          setProfileData((prev) => ({ ...prev, ...athleteData }));
        } catch (error) {
          console.log("⚠️ Could not fetch athlete details:", error.message);

          // Handle token errors
          if (
            error.status === 401 ||
            error.message.includes("Authentication failed")
          ) {
            console.log("🔐 Token expired, logging out...");
            // Don't set loading to false yet - we'll handle logout
            handleTokenExpired();
            return;
          }
        }
      } else if (userData.type === "coach") {
        try {
          console.log(`🏋️ Fetching coach ${userData.id}...`);
          const coachData = await coachAPI.getOne(userData.id);
          console.log("✅ Coach data:", coachData);
          setProfileData((prev) => ({ ...prev, ...coachData }));
        } catch (error) {
          console.log("⚠️ Could not fetch coach details:", error.message);

          // Handle token errors
          if (
            error.status === 401 ||
            error.message.includes("Authentication failed")
          ) {
            console.log("🔐 Token expired, logging out...");
            handleTokenExpired();
            return;
          }
        }
      }

      // Fetch stats (this can fail silently)
      try {
        const sessions = await sessionAPI.getAll();
        if (userData.type === "athlete") {
          const athleteSessions = sessions.filter(
            (s) => s.athlete_id === userData.id
          );
          setStats({
            totalSessions: athleteSessions.length,
            injuryWarnings: 0,
            avgSafetyScore: 85,
          });
        }
      } catch (error) {
        console.log("Could not fetch session stats:", error.message);
      }
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to handle expired tokens
  const handleTokenExpired = () => {
    Alert.alert(
      "Session Expired",
      "Your session has expired. Please login again.",
      [
        {
          text: "OK",
          onPress: async () => {
            // Clear all auth data
            await AsyncStorage.multiRemove(["authToken", "userData"]);
            // Force logout through context
            await logout();
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: performLogout,
        style: "destructive",
      },
    ]);
  };

  const performLogout = async () => {
    try {
      setLoading(true);

      // Try to call logout API (might fail if token is invalid)
      try {
        await userAPI.logout();
        console.log("✅ Backend logout successful");
      } catch (apiError) {
        console.log(
          "⚠️ API logout failed (might be expired token):",
          apiError.message
        );
        // Continue with local logout anyway
      }

      // Always clear local storage
      await AsyncStorage.multiRemove(["authToken", "userData"]);

      // Update auth context
      await logout();

      // Show success message and navigate to login
      showAlert("Logged Out", "You have been successfully logged out.", [
        {
          text: "OK",
          onPress: () => {
            // IMPORTANT: Reset navigation to Login screen
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          },
        },
      ]);
    } catch (error) {
      console.error("Logout error:", error);
      showAlert(
        "Logout Error",
        "There was an issue logging out. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Add debug function to check token
  const checkAuthStatus = async () => {
    const token = await AsyncStorage.getItem("authToken");
    const user = await AsyncStorage.getItem("userData");

    Alert.alert(
      "Auth Debug",
      `Token: ${token ? `Exists (${token.length} chars)` : "Missing"}\n\n` +
        `First 30 chars: ${
          token ? token.substring(0, 30) + "..." : "N/A"
        }\n\n` +
        `User Data: ${user ? "Exists" : "Missing"}`
    );
  };

  // Show loading state
  if (loading && !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <Loader visible={true} message="Loading profile..." />
      </SafeAreaView>
    );
  }

  // If no user data, show empty state
  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="account-off" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyStateTitle}>No User Data</Text>
          <Text style={styles.emptyStateText}>
            Please login to view your profile
          </Text>
          <Button
            title="Go to Login"
            onPress={() => navigation.navigate("Login")}
            style={styles.loginButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profileData?.name || userData?.name || "User"
                  )}&background=4A90E2&color=fff`,
                }}
                style={styles.avatar}
              />
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor:
                      userData?.type === "coach"
                        ? COLORS.warning
                        : COLORS.primary,
                  },
                ]}
              >
                <Text style={styles.typeBadgeText}>
                  {userData?.type?.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {profileData?.name || userData?.name || "User"}
              </Text>
              <Text style={styles.userEmail}>
                {profileData?.email || userData?.email || "No email"}
              </Text>

              {profileData?.created_on && (
                <View style={styles.detailItem}>
                  <Icon
                    name="calendar"
                    size={14}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    Member since:{" "}
                    {new Date(profileData.created_on).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {profileData?.coach_id && userData?.type === "athlete" && (
                <View style={styles.detailItem}>
                  <Icon
                    name="account-tie"
                    size={14}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    Coach ID: {profileData.coach_id}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {userData?.type === "athlete" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Running Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.injuryWarnings}</Text>
                <Text style={styles.statLabel}>Warnings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.avgSafetyScore}%</Text>
                <Text style={styles.statLabel}>Safety</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValue}>{userData?.id}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Account Type</Text>
              <Text style={styles.infoValue}>
                {userData?.type?.charAt(0).toUpperCase() +
                  userData?.type?.slice(1)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userData?.email}</Text>
            </View>
            {profileData?.coach_id && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Coach ID</Text>
                <Text style={styles.infoValue}>{profileData.coach_id}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                Alert.alert("Coming Soon", "Edit profile feature coming soon!")
              }
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: COLORS.primary + "20" },
                ]}
              >
                <Icon name="account-edit" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                Alert.alert("Coming Soon", "Settings feature coming soon!")
              }
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: COLORS.secondary + "20" },
                ]}
              >
                <Icon name="cog" size={24} color={COLORS.secondary} />
              </View>
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                Alert.alert(
                  "Coming Soon",
                  "Help & support feature coming soon!"
                )
              }
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: COLORS.safe + "20" },
                ]}
              >
                <Icon name="help-circle" size={24} color={COLORS.safe} />
              </View>
              <Text style={styles.actionText}>Help</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                Alert.alert(
                  "App Info",
                  "Runner Safety App v1.0.0\nInjury Prediction System"
                )
              }
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: COLORS.warning + "20" },
                ]}
              >
                <Icon name="information" size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.actionText}>About</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.logoutSection}>
          <Button
            title="Logout"
            onPress={handleLogout}
            icon="logout"
            type="outline"
            style={styles.logoutButton}
            textStyle={{ color: COLORS.danger }}
            loading={loading}
            disabled={loading}
          />

          {/* Debug section - can be removed in production */}
          <View style={styles.debugInfo}>
            <TouchableOpacity onPress={checkAuthStatus}>
              <Text style={styles.debugText}>
                User ID: {userData?.id} | Type: {userData?.type} | Auth:{" "}
                {userData ? "Yes" : "No"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Loader visible={loading} message="Processing..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  loginButton: {
    width: "80%",
  },
  header: {
    backgroundColor: COLORS.cardBackground,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  avatarContainer: {
    marginRight: 16,
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  typeBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  typeBadgeText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  detailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 16,
  },
  infoLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  actionsSection: {
    backgroundColor: COLORS.cardBackground,
    marginTop: 8,
    padding: 20,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    fontWeight: "500",
    textAlign: "center",
  },
  logoutSection: {
    backgroundColor: COLORS.cardBackground,
    marginTop: 8,
    padding: 20,
    paddingBottom: 40,
  },
  logoutButton: {
    borderColor: COLORS.danger,
  },
  debugInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  debugText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 10,
    textAlign: "center",
  },
});

export default ProfileScreen;
