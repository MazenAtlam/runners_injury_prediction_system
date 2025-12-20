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

  const handleStartSession = async () => {
    if (!userData || userData.type !== "athlete") {
      Alert.alert("Error", "Only athletes can start sessions");
      return;
    }

    setLoading(true);
    try {
      const response = await sessionAPI.create({
        athlete_id: userData.id,
        coach_id: userData.coach_id || 1, // Default to first coach if none specified
      });

      setCurrentSession(response);
      setSessionActive(true);
      setShowStartModal(false);

      // Navigate to session screen with session data
      navigation.navigate("Session", { sessionId: response.id });
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
    handleStartSession();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Start Session Modal */}
      <AlertModal
        visible={showStartModal}
        onClose={() => setShowStartModal(false)}
        title="Start Running Session"
        message="Ready to start monitoring your run? Wearable sensors will begin collecting data."
        icon="run"
        iconColor={COLORS.primary}
        confirmText="Start Session"
        onConfirm={handleConfirmStartSession}
        showCancel={true}
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
                <Button
                  title="Start Running Session"
                  onPress={() => setShowStartModal(true)}
                  icon="play"
                  style={styles.sessionButton}
                />
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
                  Alert.alert(
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
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles remain exactly the same...
const styles = StyleSheet.create({
  // ... ALL STYLES REMAIN EXACTLY AS IN YOUR CODE ...
});

export default DashboardScreen;
