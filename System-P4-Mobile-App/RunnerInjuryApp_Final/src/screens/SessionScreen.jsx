// src/screens/SessionScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import Button from "../components/Button";
import Loader from "../components/Loader";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import { sensorDataAPI, predictionAPI, sessionAPI } from "../utils/api";

const SessionScreen = ({ navigation, route }) => {
  const { userData } = useAuth();
  const { sessionId, realSensorData, isRealData = false } = route.params || {};

  const [sessionTime, setSessionTime] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sensorData, setSensorData] = useState(
    isRealData && realSensorData
      ? realSensorData
      : {
          heart_rate: 165,
          body_temperature: 37.0,
          joint_angles: 45.5,
          gait_speed: 3.2,
          cadence: 180,
          step_count: 5000,
          jump_height: 0.3,
          ground_reaction_force: 2.5,
          range_of_motion: 90.0,
          ambient_temperature: 22.5,
        }
  );
  const [prediction, setPrediction] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [usingRealData, setUsingRealData] = useState(isRealData || false);

  useEffect(() => {
    let interval = null;

    if (isActive && !usingRealData) {
      // Only simulate data if using mock data
      interval = setInterval(() => {
        setSessionTime((time) => time + 1);
        // Simulate sensor data updates every 5 seconds for mock data
        if (sessionTime % 5 === 0) {
          simulateSensorData();
        }
      }, 1000);
    } else if (!isActive && sessionTime !== 0) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, sessionTime, usingRealData]);

  const simulateSensorData = () => {
    // Only simulate if using mock data
    if (usingRealData) return;

    // Simulate slight variations in sensor data
    setSensorData((prev) => ({
      ...prev,
      heart_rate: Math.floor(160 + Math.random() * 20),
      step_count: prev.step_count + Math.floor(Math.random() * 50),
      joint_angles: 45 + Math.random() * 10 - 5,
      gait_speed: 3.2 + Math.random() * 0.4 - 0.2,
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getRiskLabel = (riskLevel) => {
    switch (riskLevel) {
      case 0:
        return "Healthy";
      case 1:
        return "Low Risk";
      case 2:
        return "Injured";
      default:
        return "Unknown";
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 0:
        return COLORS.safe;
      case 1:
        return COLORS.warning;
      case 2:
        return COLORS.danger;
      default:
        return COLORS.textSecondary;
    }
  };

  const saveSensorData = async (customData = null) => {
    if (!sessionId) return;

    try {
      const dataToSave = customData || sensorData;
      const response = await sensorDataAPI.create({
        session_id: sessionId,
        ...dataToSave,
        data_source: usingRealData ? "arduino" : "mock",
      });

      // Add to history
      setSensorHistory((prev) => [
        ...prev,
        {
          ...dataToSave,
          id: response.id,
          created_on: new Date().toISOString(),
          source: usingRealData ? "arduino" : "mock",
        },
      ]);

      return response;
    } catch (error) {
      console.error("Error saving sensor data:", error);
      throw error;
    }
  };

  const getPrediction = async () => {
    try {
      setLoading(true);
      const response = await predictionAPI.predict(sensorData);
      setPrediction(response);
      return response;
    } catch (error) {
      console.error("Error getting prediction:", error);
      const errorMessage =
        error.message || "Failed to get injury risk prediction";
      showAlert("Prediction Error", errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = () => {
    showAlert("End Session", "Are you sure you want to end this session?", [
      { text: "Continue Session", style: "cancel" },
      {
        text: "End Session",
        onPress: async () => {
          try {
            setLoading(true);

            // Save final sensor data
            if (sessionId) {
              await saveSensorData();

              // Get final prediction
              const finalPrediction = await getPrediction();

              if (finalPrediction) {
                showAlert(
                  "Session Complete",
                  `Final Risk Assessment: ${
                    finalPrediction.risk_label
                  }\nConfidence: ${(finalPrediction.confidence * 100).toFixed(
                    1
                  )}%\n\nData Source: ${
                    usingRealData ? "Arduino Sensors" : "Mock Data"
                  }`
                );
              }
            }

            // Navigate back
            navigation.goBack();
          } catch (error) {
            showAlert("Error", "Failed to properly end session");
          } finally {
            setLoading(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handlePredict = async () => {
    try {
      const predictionResult = await getPrediction();

      if (predictionResult) {
        showAlert(
          "Injury Risk Assessment",
          `Risk Level: ${predictionResult.risk_label}\nConfidence: ${(
            predictionResult.confidence * 100
          ).toFixed(1)}%\nData Source: ${
            usingRealData ? "Arduino Sensors" : "Mock Data"
          }\n\n${
            predictionResult.recommendations?.join("\n") ||
            "Continue training safely."
          }`
        );
      }
    } catch (error) {
      // Error already handled in getPrediction
    }
  };

  const handleSaveData = async () => {
    if (!sessionId) {
      showAlert("Error", "No active session found");
      return;
    }

    try {
      setLoading(true);
      await saveSensorData();
      showAlert("Success", "Sensor data saved successfully!");
    } catch (error) {
      showAlert("Error", error.message || "Failed to save sensor data");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectArduino = () => {
    navigation.navigate("SensorConnect", {
      sessionId: sessionId,
      onBack: (arduinoData) => {
        if (arduinoData) {
          setSensorData(arduinoData);
          setUsingRealData(true);
          setIsActive(true);
        }
      },
    });
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
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Running Session</Text>
            {usingRealData && (
              <View style={styles.realDataBadge}>
                <Icon name="bluetooth" size={16} color={COLORS.white} />
                <Text style={styles.realDataText}>Arduino Data</Text>
              </View>
            )}
          </View>
          <Text style={styles.time}>{formatTime(sessionTime)}</Text>
          {sessionId && (
            <Text style={styles.sessionId}>Session ID: {sessionId}</Text>
          )}
          {!usingRealData && (
            <Text style={styles.dataSource}>
              Using mock data •{" "}
              <Text style={styles.connectLink} onPress={handleConnectArduino}>
                Connect Arduino sensors
              </Text>
            </Text>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Icon name="heart-pulse" size={24} color={COLORS.danger} />
              <Text style={styles.statValue}>{sensorData.heart_rate}</Text>
              <Text style={styles.statLabel}>BPM</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="run" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{sensorData.cadence}</Text>
              <Text style={styles.statLabel}>Cadence</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="shoe-print" size={24} color={COLORS.secondary} />
              <Text style={styles.statValue}>{sensorData.step_count}</Text>
              <Text style={styles.statLabel}>Steps</Text>
            </View>
          </View>
        </View>

        {prediction && (
          <View
            style={[
              styles.statusCard,
              { backgroundColor: getRiskColor(prediction.risk_level) + "10" },
            ]}
          >
            <Icon
              name={
                prediction.risk_level === 0 ? "check-circle" : "alert-circle"
              }
              size={40}
              color={getRiskColor(prediction.risk_level)}
            />
            <Text
              style={[
                styles.statusTitle,
                { color: getRiskColor(prediction.risk_level) },
              ]}
            >
              {prediction.risk_label}
            </Text>
            <Text style={styles.statusText}>
              Confidence: {(prediction.confidence * 100).toFixed(1)}%
            </Text>
            {prediction.alerts?.length > 0 && (
              <Text style={styles.alertText}>
                Alerts: {prediction.alerts.join(", ")}
              </Text>
            )}
          </View>
        )}

        <View style={styles.sensorSection}>
          <View style={styles.sensorHeader}>
            <Text style={styles.sectionTitle}>Current Sensor Data</Text>
            {usingRealData && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            )}
          </View>
          <View style={styles.sensorGrid}>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Body Temp</Text>
              <Text style={styles.sensorValue}>
                {sensorData.body_temperature}°C
              </Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Gait Speed</Text>
              <Text style={styles.sensorValue}>
                {sensorData.gait_speed} m/s
              </Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Joint Angle</Text>
              <Text style={styles.sensorValue}>{sensorData.joint_angles}°</Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Ambient Temp</Text>
              <Text style={styles.sensorValue}>
                {sensorData.ambient_temperature}°C
              </Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Ground Force</Text>
              <Text style={styles.sensorValue}>
                {sensorData.ground_reaction_force} N
              </Text>
            </View>
            <View style={styles.sensorItem}>
              <Text style={styles.sensorLabel}>Range of Motion</Text>
              <Text style={styles.sensorValue}>
                {sensorData.range_of_motion}°
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.controls}>
          {!usingRealData && (
            <Button
              title={isActive ? "Pause Session" : "Resume Session"}
              onPress={() => setIsActive(!isActive)}
              icon={isActive ? "pause" : "play"}
              type="outline"
              style={styles.controlButton}
            />
          )}
          <Button
            title="Save Data"
            onPress={handleSaveData}
            icon="content-save"
            style={[styles.controlButton, styles.saveButton]}
            loading={loading}
          />
          {!usingRealData && (
            <Button
              title="Connect Arduino"
              onPress={handleConnectArduino}
              icon="bluetooth"
              style={[styles.controlButton, styles.arduinoButton]}
            />
          )}
        </View>

        <View style={styles.predictionControls}>
          <Button
            title="Check Injury Risk"
            onPress={handlePredict}
            icon="chart-line"
            style={styles.predictButton}
            loading={loading}
          />
          <Button
            title="End Session"
            onPress={handleEndSession}
            icon="stop"
            style={[styles.controlButton, styles.stopButton]}
          />
        </View>

        {sensorHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>
              Recent Data Points ({sensorHistory.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {sensorHistory.slice(-5).map((data, index) => (
                <View
                  key={index}
                  style={[
                    styles.historyItem,
                    data.source === "arduino" && styles.arduinoHistoryItem,
                  ]}
                >
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTime}>
                      {new Date(data.created_on).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {data.source === "arduino" && (
                      <Icon name="bluetooth" size={12} color={COLORS.primary} />
                    )}
                  </View>
                  <Text style={styles.historyValue}>HR: {data.heart_rate}</Text>
                  <Text style={styles.historyValue}>
                    Temp: {data.body_temperature}°C
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
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
  header: {
    padding: 24,
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  realDataBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  realDataText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  time: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary,
    fontWeight: "700",
    marginBottom: 8,
  },
  sessionId: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dataSource: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  connectLink: {
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
  stats: {
    padding: 24,
    backgroundColor: COLORS.cardBackground,
    marginTop: 8,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
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
  statusCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statusTitle: {
    ...TYPOGRAPHY.h3,
    marginTop: 12,
    marginBottom: 4,
  },
  statusText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  alertText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: 8,
    textAlign: "center",
  },
  sensorSection: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  sensorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.safe + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.safe,
    marginRight: 4,
  },
  liveText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.safe,
    fontSize: 10,
    fontWeight: "bold",
  },
  sensorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  sensorItem: {
    width: "48%",
    marginBottom: 16,
  },
  sensorLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  sensorValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  controls: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  predictionControls: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: "space-around",
  },
  controlButton: {
    flex: 0.3,
    minWidth: 110,
    marginBottom: 8,
  },
  predictButton: {
    flex: 0.8,
    backgroundColor: COLORS.secondary,
  },
  saveButton: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryLight,
  },
  arduinoButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stopButton: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  historySection: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  historyItem: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 120,
  },
  arduinoHistoryItem: {
    borderWidth: 1,
    borderColor: COLORS.primary + "50",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  historyTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  historyValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    fontSize: 12,
  },
});

export default SessionScreen;
