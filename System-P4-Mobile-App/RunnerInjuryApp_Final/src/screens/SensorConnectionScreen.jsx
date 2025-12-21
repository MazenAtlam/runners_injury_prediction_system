import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  SafeAreaView,
} from "react-native";

const SensorConnectionScreen = () => {
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState("");
  const [sensorData, setSensorData] = useState({
    body_temperature: "--",
    heart_rate: "--",
    joint_angles: "--",
    gait_speed: "--",
    cadence: "--",
    ground_reaction_force: "--",
    range_of_motion: "--",
    ambient_temperature: "--",
  });
  const [chartData, setChartData] = useState([]);
  const [dataCount, setDataCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("Never");
  const [prediction, setPrediction] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const maxDataPoints = 100;

  const lastTimeRef = useRef(null);
  const anglesRef = useRef({ roll: 0, pitch: 0, yaw: 0 });
  const deviceRef = useRef(null);
  const characteristicRef = useRef(null);
  const serialPortRef = useRef(null);
  const readerRef = useRef(null);
  const readLoopRef = useRef(false);

  const isWebBluetoothAvailable = false;
  const isWebSerialAvailable = false;

  // Get risk label and color functions from SessionScreen
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
        return "#4CAF50"; // COLORS.safe
      case 1:
        return "#FF9800"; // COLORS.warning
      case 2:
        return "#F44336"; // COLORS.danger
      default:
        return "#666666"; // COLORS.textSecondary
    }
  };

  // AI Prediction API call
  const getPrediction = async () => {
    try {
      setPredictionLoading(true);

      // Prepare sensor data for prediction
      const predictionData = {
        heart_rate:
          sensorData.heart_rate !== "--"
            ? parseFloat(sensorData.heart_rate)
            : 165,
        body_temperature:
          sensorData.body_temperature !== "--"
            ? parseFloat(sensorData.body_temperature)
            : 37.0,
        joint_angles:
          sensorData.joint_angles !== "--"
            ? parseFloat(sensorData.joint_angles)
            : 45.5,
        gait_speed:
          sensorData.gait_speed !== "--"
            ? parseFloat(sensorData.gait_speed)
            : 3.2,
        cadence:
          sensorData.cadence !== "--" ? parseFloat(sensorData.cadence) : 180,
        ground_reaction_force:
          sensorData.ground_reaction_force !== "--"
            ? parseFloat(sensorData.ground_reaction_force)
            : 2.5,
        range_of_motion:
          sensorData.range_of_motion !== "--"
            ? parseFloat(sensorData.range_of_motion)
            : 90.0,
        ambient_temperature:
          sensorData.ambient_temperature !== "--"
            ? parseFloat(sensorData.ambient_temperature)
            : 22.5,
      };

      // This would be replaced with actual API call
      // const response = await predictionAPI.predict(predictionData);

      // Simulate API response for demo
      const simulatedResponse = {
        risk_level: Math.floor(Math.random() * 3), // Random risk level 0-2
        risk_label: "",
        confidence: 0.8 + Math.random() * 0.2, // 80-100% confidence
        alerts: [],
        recommendations: [
          "Maintain current pace",
          "Monitor heart rate",
          "Stay hydrated",
        ],
      };

      simulatedResponse.risk_label = getRiskLabel(simulatedResponse.risk_level);

      // Add alerts based on sensor data
      if (predictionData.heart_rate > 180) {
        simulatedResponse.alerts.push("High heart rate");
      }
      if (predictionData.joint_angles > 60) {
        simulatedResponse.alerts.push("Abnormal joint angle");
      }
      if (predictionData.gait_speed < 1.5) {
        simulatedResponse.alerts.push("Slow gait speed");
      }

      setPrediction(simulatedResponse);

      // Show prediction alert
      Alert.alert(
        "Injury Risk Assessment",
        `Risk Level: ${simulatedResponse.risk_label}\nConfidence: ${(
          simulatedResponse.confidence * 100
        ).toFixed(1)}%\n\n${simulatedResponse.recommendations.join("\n")}`,
        [{ text: "OK" }]
      );

      return simulatedResponse;
    } catch (error) {
      console.error("Error getting prediction:", error);
      Alert.alert(
        "Prediction Error",
        error.message || "Failed to get injury risk prediction"
      );
      throw error;
    } finally {
      setPredictionLoading(false);
    }
  };

  const handlePredict = async () => {
    try {
      await getPrediction();
    } catch (error) {
      // Error already handled in getPrediction
    }
  };

  // Parse sensor data function remains the same
  const parseSensorData = (text) => {
    try {
      const lines = text.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (
          !trimmedLine ||
          trimmedLine.includes("Bluetooth Connected") ||
          trimmedLine.includes("Format:") ||
          trimmedLine.includes("T1,T2")
        ) {
          continue;
        }

        if (trimmedLine.includes(",")) {
          const values = trimmedLine.split(",").map((v) => v.trim());

          if (values.length === 9) {
            try {
              const temp1 = parseFloat(values[0]);
              const temp2 = parseFloat(values[1]);
              const heart_rate = parseFloat(values[2]);

              if (isNaN(temp1) || isNaN(temp2) || isNaN(heart_rate)) {
                continue;
              }

              const ax_raw = parseInt(values[3]);
              const ay_raw = parseInt(values[4]);
              const az_raw = parseInt(values[5]);
              const ax_g = ax_raw / 16384.0;
              const ay_g = ay_raw / 16384.0;
              const az_g = az_raw / 16384.0;

              const roll = Math.atan2(ay_g, az_g) * (180 / Math.PI);
              const pitch =
                Math.atan2(-ax_g, Math.sqrt(ay_g ** 2 + az_g ** 2)) *
                (180 / Math.PI);

              const gx_raw = parseInt(values[6]);
              const gy_raw = parseInt(values[7]);
              const gz_raw = parseInt(values[8]);
              const gz_dps = gz_raw / 131.0;

              const currentTime = Date.now();
              if (lastTimeRef.current) {
                const dt = (currentTime - lastTimeRef.current) / 1000;
                anglesRef.current.yaw += gz_dps * dt;

                if (anglesRef.current.yaw > 180) {
                  anglesRef.current.yaw -= 360;
                } else if (anglesRef.current.yaw < -180) {
                  anglesRef.current.yaw += 360;
                }
              }
              lastTimeRef.current = currentTime;

              const gait_speed = Math.sqrt(ax_g ** 2 + ay_g ** 2 + az_g ** 2);
              const cadence = Math.abs(roll) * 2;
              const ground_reaction_force = az_g * 9.8;
              const range_of_motion =
                Math.abs(roll) +
                Math.abs(pitch) +
                Math.abs(anglesRef.current.yaw);

              const newData = {
                body_temperature: temp1.toFixed(1),
                ambient_temperature: temp2.toFixed(1),
                heart_rate: heart_rate.toFixed(0),
                joint_angles: roll.toFixed(1),
                gait_speed: gait_speed.toFixed(2),
                cadence: cadence.toFixed(0),
                ground_reaction_force: ground_reaction_force.toFixed(2),
                range_of_motion: range_of_motion.toFixed(1),
              };

              setSensorData({ ...newData });
              setDataCount((prev) => prev + 1);
              setLastUpdate(new Date().toLocaleTimeString());

              const timestamp = new Date().toLocaleTimeString();
              setChartData((prev) => {
                const updated = [
                  ...prev,
                  {
                    time: timestamp,
                    body_temperature: temp1,
                    heart_rate: heart_rate,
                    joint_angles: roll,
                    gait_speed: gait_speed,
                    ax: ax_g,
                    ay: ay_g,
                    az: az_g,
                    roll: roll,
                    pitch: pitch,
                    yaw: anglesRef.current.yaw,
                  },
                ];
                return updated.slice(-maxDataPoints);
              });

              console.log(
                "📊 UPDATE:",
                temp1.toFixed(1) + "°C",
                heart_rate.toFixed(0) + "BPM",
                "Roll:" + roll.toFixed(1) + "°"
              );
            } catch (parseError) {
              console.log("⚠️ Parse error for values:", values);
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Parse error:", error);
    }
  };

  // Connection functions remain the same
  const connectWebSerial = async () => {
    try {
      setLoading(true);
      Alert.alert(
        "Info",
        "Web Serial is not available in React Native. Use BLE instead."
      );
    } catch (error) {
      console.error("❌ Serial error:", error);
      Alert.alert("Connection Error", error.message);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const connectBLE = async () => {
    try {
      setLoading(true);
      Alert.alert(
        "Info",
        "BLE connection would require React Native BLE libraries."
      );

      setTimeout(() => {
        setIsConnected(true);
        setConnectionType("BLE Device");
        setLoading(false);
        Alert.alert("✅ Connected", "Connected to BLE device!");
      }, 1000);
    } catch (error) {
      console.error("❌ BLE error:", error);
      Alert.alert("BLE Connection Error", error.message);
      setIsConnected(false);
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      readLoopRef.current = false;

      setIsConnected(false);
      setConnectionType("");
      deviceRef.current = null;
      characteristicRef.current = null;
      serialPortRef.current = null;

      anglesRef.current = { roll: 0, pitch: 0, yaw: 0 };
      lastTimeRef.current = null;

      Alert.alert("Disconnected");
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  const clearData = () => {
    setChartData([]);
    setDataCount(0);
    anglesRef.current = { roll: 0, pitch: 0, yaw: 0 };
    lastTimeRef.current = null;
    setLastUpdate("Never");
    setPrediction(null);
    Alert.alert("✅ All data cleared");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    gradientContainer: {
      flex: 1,
      backgroundColor: "#667eea",
      padding: 20,
    },
    header: {
      backgroundColor: "white",
      padding: 20,
      borderRadius: 15,
      marginBottom: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
    },
    headerText: {
      color: "#667eea",
      fontSize: 24,
      fontWeight: "bold",
    },
    statusIndicator: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: "#f0f0f0",
      borderRadius: 25,
      fontWeight: "600",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    guideContainer: {
      backgroundColor: "#e7f3ff",
      padding: 20,
      borderRadius: 15,
      marginBottom: 20,
      borderWidth: 2,
      borderColor: "#667eea",
    },
    button: {
      padding: 15,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    dataCard: {
      backgroundColor: "white",
      padding: 20,
      borderRadius: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    debugContainer: {
      backgroundColor: "rgba(255,255,255,0.9)",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#e0e0e0",
      marginBottom: 20,
    },
    loadingOverlay: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: [{ translateX: -50 }, { translateY: -50 }],
      backgroundColor: "white",
      paddingHorizontal: 40,
      paddingVertical: 20,
      borderRadius: 12,
      elevation: 5,
      zIndex: 1000,
    },
    // New styles for prediction section
    predictionCard: {
      backgroundColor: "white",
      padding: 20,
      borderRadius: 15,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
      alignItems: "center",
    },
    predictionTitle: {
      fontSize: 18,
      marginBottom: 16,
      color: "#333",
      fontWeight: "bold",
    },
    riskLevelText: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 8,
    },
    confidenceText: {
      fontSize: 16,
      color: "#666",
      marginBottom: 12,
    },
    predictButton: {
      padding: 15,
      borderRadius: 12,
      backgroundColor: "#4CAF50",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
    },
    predictButtonText: {
      color: "white",
      fontWeight: "600",
      fontSize: 16,
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#667eea" }}>
      <ScrollView style={styles.gradientContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerText}>🔬 Arduino Sensor Dashboard</Text>
            <Text style={{ marginTop: 8, color: "#666", fontSize: 14 }}>
              HC-05 Connection (via USB/COM Port) • Last Update: {lastUpdate}
            </Text>
          </View>
          <View style={styles.statusIndicator}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: isConnected ? "#00ff00" : "#ff4444",
              }}
            />
            <Text>
              {isConnected ? `Connected (${connectionType})` : "Disconnected"}
            </Text>
          </View>
        </View>

        {/* AI Prediction Section */}
        <View style={styles.predictionCard}>
          <Text style={styles.predictionTitle}>
            🤖 AI Injury Risk Assessment
          </Text>

          {prediction ? (
            <View style={{ alignItems: "center" }}>
              <Text
                style={[
                  styles.riskLevelText,
                  { color: getRiskColor(prediction.risk_level) },
                ]}
              >
                {prediction.risk_label}
              </Text>
              <Text style={styles.confidenceText}>
                Confidence: {(prediction.confidence * 100).toFixed(1)}%
              </Text>
              {prediction.alerts && prediction.alerts.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text
                    style={{
                      color: "#F44336",
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
                    ⚠️ Alerts:
                  </Text>
                  {prediction.alerts.map((alert, index) => (
                    <Text key={index} style={{ color: "#666", fontSize: 12 }}>
                      • {alert}
                    </Text>
                  ))}
                </View>
              )}
              {prediction.recommendations &&
                prediction.recommendations.length > 0 && (
                  <View>
                    <Text
                      style={{
                        color: "#4CAF50",
                        fontWeight: "600",
                        marginBottom: 4,
                      }}
                    >
                      💡 Recommendations:
                    </Text>
                    {prediction.recommendations.map((rec, index) => (
                      <Text
                        key={index}
                        style={{
                          color: "#666",
                          fontSize: 12,
                          textAlign: "center",
                        }}
                      >
                        • {rec}
                      </Text>
                    ))}
                  </View>
                )}
            </View>
          ) : (
            <Text
              style={{ color: "#666", textAlign: "center", marginBottom: 10 }}
            >
              No prediction yet. Click "Check Injury Risk" to analyze current
              sensor data.
            </Text>
          )}

          <TouchableOpacity
            onPress={handlePredict}
            disabled={predictionLoading || sensorData.heart_rate === "--"}
            style={[
              styles.predictButton,
              {
                backgroundColor:
                  predictionLoading || sensorData.heart_rate === "--"
                    ? "#ccc"
                    : "#4CAF50",
              },
            ]}
          >
            <Text style={styles.predictButtonText}>
              {predictionLoading ? "Analyzing..." : "🔍 Check Injury Risk"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Setup Guide */}
        <View style={styles.guideContainer}>
          <Text
            style={{
              color: "#667eea",
              marginBottom: 10,
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            📖 USB Connection Setup
          </Text>
          <Text style={{ lineHeight: 24 }}>
            1. Connect Arduino to computer via USB cable{"\n"}
            2. Open this page in{" "}
            <Text style={{ fontWeight: "bold" }}>Chrome</Text> or{" "}
            <Text style={{ fontWeight: "bold" }}>Edge</Text> browser{"\n"}
            3. Click "🔌 Connect via USB/COM Port" below{"\n"}
            4. Select Arduino's COM port from the list{"\n"}
            5. Watch sensor data stream in real-time! 🎉
          </Text>
          <Text
            style={{
              color: "#666",
              fontStyle: "italic",
              marginTop: 10,
              fontSize: 12,
            }}
          >
            💡 Windows Bluetooth: Pair HC-05 first, then look for "Standard
            Serial over Bluetooth" COM port
          </Text>
        </View>

        {/* Connection Buttons */}
        <View style={{ marginBottom: 20 }}>
          {!isConnected ? (
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={connectWebSerial}
                disabled={loading}
                style={[
                  styles.button,
                  {
                    backgroundColor: loading ? "#ccc" : "#667eea",
                  },
                ]}
              >
                <Text
                  style={{ color: "white", fontWeight: "600", fontSize: 16 }}
                >
                  {loading
                    ? "⏳ Connecting..."
                    : "🔌 Connect via USB/COM Port (Recommended)"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={connectBLE}
                disabled={loading}
                style={[
                  styles.button,
                  {
                    backgroundColor: loading ? "#ccc" : "#4ecdc4",
                  },
                ]}
              >
                <Text
                  style={{ color: "white", fontWeight: "600", fontSize: 14 }}
                >
                  🔵 Try BLE Connection (HM-10, nRF52, etc.)
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.2)",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{ fontSize: 12, color: "white", textAlign: "center" }}
                >
                  Web Serial:{" "}
                  {isWebSerialAvailable ? "✅ Available" : "❌ Not Available"} |
                  Web Bluetooth:{" "}
                  {isWebBluetoothAvailable
                    ? "✅ Available"
                    : "❌ Not Available"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={disconnect}
                style={[
                  styles.button,
                  {
                    flex: 1,
                    backgroundColor: "white",
                    borderWidth: 2,
                    borderColor: "#ff4444",
                  },
                ]}
              >
                <Text
                  style={{ color: "#ff4444", fontWeight: "600", fontSize: 16 }}
                >
                  🔴 Disconnect
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={clearData}
                style={[
                  styles.button,
                  {
                    flex: 1,
                    backgroundColor: "#6c757d",
                  },
                ]}
              >
                <Text
                  style={{ color: "white", fontWeight: "600", fontSize: 16 }}
                >
                  🗑️ Clear Data
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Current Values */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              color: "white",
              marginBottom: 16,
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            📊 Current Values (Updates: {dataCount})
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 20,
              justifyContent: "space-between",
            }}
          >
            {[
              {
                title: "🌡️ Temperature 1",
                value: sensorData.body_temperature,
                unit: "°C",
                color: "#667eea",
              },
              {
                title: "🌡️ Temperature 2",
                value: sensorData.ambient_temperature,
                unit: "°C",
                color: "#ff6b6b",
              },
              {
                title: "❤️ Heart Rate",
                value: sensorData.heart_rate,
                unit: "BPM",
                color: "#e74c3c",
              },
              {
                title: "📐 Roll Angle",
                value: sensorData.joint_angles,
                unit: "°",
                color: "#4ecdc4",
              },
              {
                title: "🚶 Gait Speed",
                value: sensorData.gait_speed,
                unit: "m/s",
                color: "#f7b731",
              },
              {
                title: "🔄 ROM",
                value: sensorData.range_of_motion,
                unit: "°",
                color: "#a8b3ff",
              },
            ].map((item, index) => (
              <View
                key={index}
                style={[styles.dataCard, { flex: 1, minWidth: 150 }]}
              >
                <Text style={{ fontSize: 18, marginBottom: 10, color: "#333" }}>
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    color: item.color,
                  }}
                >
                  {item.value} {item.unit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.dataCard}>
          <Text style={{ fontSize: 18, marginBottom: 16, color: "#333" }}>
            📈 Statistics
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                Data Points
              </Text>
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "#667eea" }}
              >
                {dataCount}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                Chart Buffer
              </Text>
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "#667eea" }}
              >
                {chartData.length}/{maxDataPoints}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                Connection
              </Text>
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "#667eea" }}
              >
                {isConnected ? "✅" : "❌"}
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                Last Update
              </Text>
              <Text
                style={{ fontSize: 16, fontWeight: "bold", color: "#667eea" }}
              >
                {lastUpdate}
              </Text>
            </View>
          </View>
        </View>

        {/* Debug Info */}
        <View style={styles.debugContainer}>
          <Text
            style={{
              marginBottom: 12,
              fontSize: 14,
              color: "#333",
              fontWeight: "bold",
            }}
          >
            🔧 Debug Info
          </Text>
          <Text style={{ fontSize: 11, color: "#666", lineHeight: 20 }}>
            Platform: React Native{"\n"}
            Web Serial: Not Available ❌{"\n"}
            Web Bluetooth: Not Available ❌{"\n"}
            Status: {isConnected ? "Connected ✅" : "Disconnected ❌"}
            {"\n"}
            Connection Type: {connectionType || "None"}
            {"\n"}
            Reading Loop Active: {readLoopRef.current ? "Yes ✅" : "No ❌"}
            {"\n"}
            Last Update: {lastUpdate}
            {"\n"}
            Yaw Angle: {anglesRef.current.yaw.toFixed(1)}°{"\n"}
            Chart Data Points: {chartData.length}
            {"\n"}
            AI Prediction:{" "}
            {prediction ? `Active (${prediction.risk_label})` : "None"}
          </Text>
        </View>
      </ScrollView>

      {/* Loading Overlays */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>
            ⏳ Connecting...
          </Text>
        </View>
      )}

      {predictionLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#333" }}>
            🤖 Analyzing Risk...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default SensorConnectionScreen;
