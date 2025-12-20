// src/screens/DashboardScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import Button from "../components/Button";
import AlertModal from "../components/AlertModal";
import Loader from "../components/Loader";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { sessionAPI, sensorDataAPI, athleteAPI } from "../utils/api";

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    heartRate: 72,
    cadence: 165,
    safetyScore: 85,
  });
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  const { userData } = useAuth();

  // Fetch sessions on component mount
  useEffect(() => {
    fetchSessions();
    checkActiveSession();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      setSessions(response);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const checkActiveSession = async () => {
    // In a real app, you might check for an ongoing session
    // For now, we'll assume no active session on load
    setSessionActive(false);
  };

  const handleStartSession = async (useRealSensors = false) => {
    if (!userData || userData.type !== "athlete") {
      Alert.alert("Error", "Only athletes can start sessions");
      return;
    }

    setLoading(true);
    try {
      const response = await sessionAPI.create({
        athlete_id: userData.id,
        coach_id: userData.coach_id || 1, // Default to first coach if none specified
        sensor_type: useRealSensors ? "arduino" : "mock",
      });

      setCurrentSession(response);
      setSessionActive(true);
      setShowStartModal(false);

      if (useRealSensors) {
        // Navigate to sensor connection screen for real Arduino data
        navigation.navigate("SensorConnect", {
          sessionId: response.id,
          onBack: () => {
            setSessionActive(false);
            setCurrentSession(null);
          },
        });
      } else {
        // Navigate to session screen with mock data
        navigation.navigate("Session", {
          sessionId: response.id,
          isRealData: false,
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (!currentSession) return;

    try {
      await sessionAPI.delete(currentSession.id);
      setSessionActive(false);
      setCurrentSession(null);
      Alert.alert("Success", "Session ended successfully");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to end session");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSessions();
      // Fetch latest stats
      // In a real app, you would fetch latest sensor data
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewHistory = () => {
    setShowHistoryModal(true);
    // In a real app, you would navigate to a history screen
  };

  const handleConfirmStartSession = () => {
    handleStartSession(false); // false = use mock data
  };

  // Web-compatible alert function
  const showAlert = (title, message, buttons = [{ text: "OK" }]) => {
    if (Platform.OS === "web") {
      if (buttons.length === 1) {
        window.alert(`${title}\n\n${message}`);
        if (buttons[0].onPress) buttons[0].onPress();
      } else if (buttons.length === 2) {
        const result = window.confirm(`${title}\n\n${message}`);
        if (result) {
          if (buttons[1].onPress) buttons[1].onPress();
        } else {
          if (buttons[0].onPress) buttons[0].onPress();
        }
      }
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Start Session Modal */}
      <AlertModal
        visible={showStartModal}
        onClose={() => setShowStartModal(false)}
        title="Start Running Session"
        message="Ready to start monitoring your run? Choose your data source:"
        icon="run"
        iconColor={COLORS.primary}
        confirmText="Use Mock Data"
        onConfirm={handleConfirmStartSession}
        showCancel={true}
        cancelText="Use Arduino Sensors"
        onCancel={() => {
          setShowStartModal(false);
          handleStartSession(true); // true = use real sensors
        }}
      />

      {/* History Modal */}
      <AlertModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Run History"
        message={`You have ${sessions.length} past sessions. Track your progress over time!`}
        icon="history"
        iconColor={COLORS.primary}
        confirmText="Got it"
        showCancel={false}
      />

      {/* Safety Tips Modal */}
      <AlertModal
        visible={showTipsModal}
        onClose={() => setShowTipsModal(false)}
        title="Safety Tips"
        message="• Always warm up before running\n• Stay hydrated\n• Wear reflective gear at night\n• Listen to your body\n• Choose well-lit routes"
        icon="lightbulb"
        iconColor={COLORS.safe}
        confirmText="Thanks!"
        showCancel={false}
      />

      <Loader visible={loading} message="Starting session..." />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>
              Welcome back, {userData?.name || "Runner"}!
            </Text>
            <Text style={styles.subtitle}>
              {userData?.type === "coach"
                ? "Coach Dashboard"
                : "Ready for your next run?"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <Icon name="account-circle" size={40} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="heart-pulse" size={24} color={COLORS.danger} />
            <Text style={styles.statValue}>{stats.heartRate}</Text>
            <Text style={styles.statLabel}>BPM</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="run" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.cadence}</Text>
            <Text style={styles.statLabel}>Cadence</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="shield-check" size={24} color={COLORS.safe} />
            <Text style={styles.statValue}>{stats.safetyScore}%</Text>
            <Text style={styles.statLabel}>Safety</Text>
          </View>
        </View>

        {userData?.type === "athlete" && (
          <View style={styles.sessionSection}>
            <View style={styles.sessionCard}>
              <Text style={styles.sessionTitle}>
                {sessionActive ? "Session Active" : "Start New Session"}
              </Text>
              <Text style={styles.sessionDescription}>
                {sessionActive
                  ? "Your run is being monitored in real-time"
                  : "Begin monitoring your running metrics"}
              </Text>

              {sessionActive ? (
                <View style={styles.sessionActiveContainer}>
                  <Button
                    title="Go to Session"
                    onPress={() =>
                      navigation.navigate("Session", {
                        sessionId: currentSession?.id,
                      })
                    }
                    icon="play-circle"
                    style={styles.sessionButton}
                  />
                  <Button
                    title="Stop Session"
                    onPress={handleStopSession}
                    type="outline"
                    style={styles.stopButton}
                    textStyle={{ color: COLORS.danger }}
                  />
                </View>
              ) : (
                <View style={styles.sessionOptions}>
                  <Button
                    title="Start with Mock Data"
                    onPress={() => setShowStartModal(true)}
                    icon="play"
                    style={[styles.sessionButton, styles.mockButton]}
                  />
                  <Button
                    title="Start with Arduino Sensors"
                    onPress={() => handleStartSession(true)}
                    icon="bluetooth"
                    style={[styles.sessionButton, styles.realButton]}
                  />
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleViewHistory}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: COLORS.primaryLight + "20" },
                ]}
              >
                <Icon name="history" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.actionText}>History ({sessions.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setShowTipsModal(true)}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: COLORS.safe + "20" },
                ]}
              >
                <Icon name="lightbulb" size={24} color={COLORS.safe} />
              </View>
              <Text style={styles.actionText}>Safety Tips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("Profile")}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: COLORS.secondary + "20" },
                ]}
              >
                <Icon name="account" size={24} color={COLORS.secondary} />
              </View>
              <Text style={styles.actionText}>Profile</Text>
            </TouchableOpacity>

            {userData?.type === "coach" && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => {
                  // In a real app, navigate to coach management
                  showAlert(
                    "Coach Features",
                    "Coach management features coming soon!"
                  );
                }}
              >
                <View
                  style={[
                    styles.actionIcon,
                    { backgroundColor: COLORS.warning + "20" },
                  ]}
                >
                  <Icon name="account-group" size={24} color={COLORS.warning} />
                </View>
                <Text style={styles.actionText}>My Athletes</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Arduino Sensor Info */}
        <View style={styles.sensorInfoCard}>
          <View style={styles.sensorInfoHeader}>
            <Icon name="bluetooth" size={24} color={COLORS.primary} />
            <Text style={styles.sensorInfoTitle}>
              Arduino Sensor Integration
            </Text>
          </View>
          <Text style={styles.sensorInfoText}>
            Connect your Arduino with HC-05 Bluetooth module to get real-time
            sensor data including:
          </Text>
          <View style={styles.sensorFeatures}>
            <View style={styles.featureItem}>
              <Icon name="thermometer" size={16} color={COLORS.danger} />
              <Text style={styles.featureText}>Body Temperature</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="axis-arrow" size={16} color={COLORS.primary} />
              <Text style={styles.featureText}>Joint Angles</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="speedometer" size={16} color={COLORS.secondary} />
              <Text style={styles.featureText}>Gait Analysis</Text>
            </View>
            <View style={styles.featureItem}>
              <Icon name="weight" size={16} color={COLORS.warning} />
              <Text style={styles.featureText}>Ground Reaction Force</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.learnMoreButton}
            onPress={() => {
              showAlert(
                "Arduino Setup",
                "To use Arduino sensors:\n\n1. Flash Arduino with provided code\n2. Connect HC-05 Bluetooth module\n3. Pair with your device (PIN: 1234)\n4. Click 'Start with Arduino Sensors'"
              );
            }}
          >
            <Text style={styles.learnMoreText}>Learn How to Setup Arduino</Text>
            <Icon name="chevron-right" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: COLORS.cardBackground,
  },
  welcome: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  profileButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: COLORS.cardBackground,
    marginTop: 8,
  },
  statCard: {
    alignItems: "center",
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginVertical: 8,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sessionSection: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sessionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  sessionDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  sessionActiveContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sessionOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sessionButton: {
    flex: 1,
  },
  mockButton: {
    flex: 0.48,
    backgroundColor: COLORS.primaryLight,
  },
  realButton: {
    flex: 0.48,
    backgroundColor: COLORS.secondary,
  },
  stopButton: {
    borderColor: COLORS.danger,
    marginLeft: 12,
    flex: 0.4,
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
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
  sensorInfoCard: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  sensorInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sensorInfoTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    marginLeft: 12,
  },
  sensorInfoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  sensorFeatures: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  learnMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: COLORS.primary + "20",
    borderRadius: 8,
  },
  learnMoreText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "500",
  },
});

export default DashboardScreen;
