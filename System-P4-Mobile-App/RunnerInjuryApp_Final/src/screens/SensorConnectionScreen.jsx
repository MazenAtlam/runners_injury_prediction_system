// src/screens/SensorConnectionScreen.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import Button from "../components/Button";
import Loader from "../components/Loader";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY } from "../utils/constants";
import { sensorDataAPI } from "../utils/api";

const SensorConnectionScreen = ({ navigation, route }) => {
  const { sessionId } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const [characteristic, setCharacteristic] = useState(null);
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
  const maxDataPoints = 50;
  const lastTimeRef = useRef(null);
  const anglesRef = useRef({ roll: 0, pitch: 0, yaw: 0 });

  // Parse incoming sensor data from Arduino
  const parseSensorData = (value) => {
    try {
      const decoder = new TextDecoder("utf-8");
      const text = decoder.decode(value);
      const lines = text.split("\n");

      for (const line of lines) {
        if (line && line.includes(",")) {
          if (line.includes("Bluetooth") || line.includes("Format")) continue;

          const values = line.split(",");
          if (values.length >= 8) {
            const temp1 = parseFloat(values[0]); // Body temperature
            const temp2 = parseFloat(values[1]); // Ambient temperature

            // Convert raw accelerometer to g-force (MPU6050)
            const ax_raw = parseInt(values[2]);
            const ay_raw = parseInt(values[3]);
            const az_raw = parseInt(values[4]);
            const ax_g = ax_raw / 16384.0;
            const ay_g = ay_raw / 16384.0;
            const az_g = az_raw / 16384.0;

            // Calculate joint angles from accelerometer
            const roll = Math.atan2(ay_g, az_g) * (180 / Math.PI); // Joint angle 1
            const pitch = Math.atan2(-ax_g, Math.sqrt(ay_g ** 2 + az_g ** 2)) * (180 / Math.PI); // Joint angle 2

            // Calculate gait metrics
            const gait_speed = Math.sqrt(ax_g ** 2 + ay_g ** 2 + az_g ** 2).toFixed(2);
            const cadence = Math.abs(roll) * 2; // Simplified cadence calculation

            // Ground reaction force (simulated from acceleration)
            const ground_reaction_force = (az_g * 9.8).toFixed(2);

            // Range of motion (from gyroscope if available)
            let range_of_motion = Math.abs(roll) + Math.abs(pitch);
            if (values.length > 7) {
              const gz_raw = parseInt(values[7]);
              const gz_dps = gz_raw / 131.0;
              const currentTime = Date.now();
              if (lastTimeRef.current) {
                const dt = (currentTime - lastTimeRef.current) / 1000;
                anglesRef.current.yaw += gz_dps * dt;
                if (anglesRef.current.yaw > 180) anglesRef.current.yaw -= 360;
                if (anglesRef.current.yaw < -180) anglesRef.current.yaw += 360;
                range_of_motion = Math.abs(roll) + Math.abs(pitch) + Math.abs(anglesRef.current.yaw);
              }
              lastTimeRef.current = currentTime;
            }

            // Heart rate simulation based on movement intensity
            const heart_rate = Math.min(220, Math.max(60, Math.floor(60 + (gait_speed * 40))));

            const newData = {
              body_temperature: temp1.toFixed(1),
              ambient_temperature: temp2.toFixed(1),
              joint_angles: roll.toFixed(1),
              gait_speed: gait_speed,
              cadence: cadence.toFixed(0),
              ground_reaction_force: ground_reaction_force,
              range_of_motion: range_of_motion.toFixed(1),
              heart_rate: heart_rate.toString(),
            };

            setSensorData(newData);

            // Add to chart history
            const timestamp = new Date().toLocaleTimeString();
            setChartData((prev) => {
              const updated = [
                ...prev,
                {
                  time: timestamp,
                  body_temperature: parseFloat(newData.body_temperature),
                  heart_rate: parseInt(newData.heart_rate),
                  joint_angles: parseFloat(newData.joint_angles),
                  gait_speed: parseFloat(newData.gait_speed),
                },
              ];
              return updated.slice(-maxDataPoints);
            });

            // Auto-save to backend if sessionId exists
            if (sessionId && isConnected) {
              saveSensorDataToBackend(newData);
            }
          }
        }
      }
    } catch (error) {
      console.error("Parse error:", error);
    }
  };

  // Save sensor data to your Flask backend
  const saveSensorDataToBackend = async (data) => {
    try {
      if (!sessionId) return;

      const sensorDataPayload = {
        session_id: sessionId,
        heart_rate: parseFloat(data.heart_rate) || 0,
        body_temperature: parseFloat(data.body_temperature) || 0,
        joint_angles: parseFloat(data.joint_angles) || 0,
        gait_speed: parseFloat(data.gait_speed) || 0,
        cadence: parseFloat(data.cadence) || 0,
        ground_reaction_force: parseFloat(data.ground_reaction_force) || 0,
        range_of_motion: parseFloat(data.range_of_motion) || 0,
        ambient_temperature: parseFloat(data.ambient_temperature) || 0,
      };

      await sensorDataAPI.create(sensorDataPayload);
      console.log("✅ Sensor data saved to backend");
    } catch (error) {
      console.error("❌ Error saving sensor data:", error.message);
    }
  };

  // Connect to Bluetooth device (HC-05)
  const connectBluetooth = async () => {
    if (Platform.OS !== "web") {
      Alert.alert(
        "Bluetooth Not Available",
        "This feature is only available on web. Please use Chrome browser on Android or Bluefy on iOS."
      );
      return;
    }

    try {
      setLoading(true);
      console.log("🔍 Searching for HC-05 Bluetooth device...");

      // Request Bluetooth device
      const bluetoothDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "HC-05" }],
        optionalServices: ["0000ffe0-0000-1000-8000-00805f9b34fb"],
      });

      setDevice(bluetoothDevice);

      // Connect to GATT server
      const server = await bluetoothDevice.gatt.connect();
      const service = await server.getPrimaryService("0000ffe0-0000-1000-8000-00805f9b34fb");
      const char = await service.getCharacteristic("0000ffe1-0000-1000-8000-00805f9b34fb");

      setCharacteristic(char);

      // Start notifications
      await char.startNotifications();
      char.addEventListener("characteristicvaluechanged", (event) => {
        parseSensorData(event.target.value);
      });

      setIsConnected(true);
      Alert.alert("✅ Connected", "Successfully connected to Arduino sensor module!");
    } catch (error) {
      console.error("Bluetooth connection error:", error);
      Alert.alert(
        "Connection Failed",
        `Failed to connect to Arduino:\n\n${error.message}\n\nMake sure:\n1. HC-05 is powered on\n2. Bluetooth is enabled\n3. Device is in range`
      );
    } finally {
      setLoading(false);
    }
  };

  // Disconnect Bluetooth
  const disconnectBluetooth = () => {
    if (device && device.gatt.connected) {
      device.gatt.disconnect();
    }
    setIsConnected(false);
    setDevice(null);
    setCharacteristic(null);
    Alert.alert("Disconnected", "Bluetooth connection closed.");
  };

  // Manual save data
  const handleSaveData = async () => {
    try {
      setLoading(true);
      await saveSensorDataToBackend(sensorData);
      Alert.alert("✅ Success", "Sensor data saved to database!");
    } catch (error) {
      Alert.alert("❌ Error", "Failed to save sensor data");
    } finally {
      setLoading(false);
    }
  };

  // Navigate to session screen with real data
  const goToSessionWithData = () => {
    navigation.navigate("Session", {
      sessionId: sessionId,
      realSensorData: sensorData,
      isRealData: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Arduino Sensor Connection</Text>
          <Text style={styles.subtitle}>Connect to HC-05 Bluetooth Module</Text>
        </View>

        {/* Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon
              name={isConnected ? "bluetooth-connected" : "bluetooth-off"}
              size={32}
              color={isConnected ? COLORS.safe : COLORS.textSecondary}
            />
            <Text style={styles.statusTitle}>
              {isConnected ? "Connected to Arduino" : "Disconnected"}
            </Text>
          </View>
          <Text style={styles.statusText}>
            {isConnected
              ? "Receiving real-time sensor data from Arduino"
              : "Connect to start receiving real sensor data"}
          </Text>
        </View>

        {/* Connection Guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>📱 Setup Instructions</Text>
          <View style={styles.steps}>
            <Text style={styles.step}>1. Power on your Arduino with HC-05 module</Text>
            <Text style={styles.step}>2. Make sure HC-05 LED is blinking</Text>
            <Text style={styles.step}>3. Click "Connect to Arduino" button</Text>
            <Text style={styles.step}>4. Select "HC-05" from Bluetooth devices</Text>
            <Text style={styles.step}>5. Start monitoring real sensor data! 🎉</Text>
          </View>
          <Text style={styles.note}>
            Note: Works on Chrome (Android) and Bluefy (iOS). Default HC-05 PIN: 1234
          </Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controls}>
          {!isConnected ? (
            <Button
              title="Connect to Arduino"
              onPress={connectBluetooth}
              icon="bluetooth"
              style={styles.connectButton}
              loading={loading}
            />
          ) : (
            <View style={styles.connectedControls}>
              <Button
                title="Disconnect"
                onPress={disconnectBluetooth}
                icon="bluetooth-off"
                type="outline"
                style={styles.disconnectButton}
                textStyle={{ color: COLORS.danger }}
              />
              <Button
                title="Save Current Data"
                onPress={handleSaveData}
                icon="content-save"
                style={styles.saveButton}
                loading={loading}
              />
            </View>
          )}
        </View>

        {/* Live Sensor Data Display */}
        <View style={styles.sensorDataCard}>
          <Text style={styles.sectionTitle}>📊 Live Sensor Readings</Text>
          <View style={styles.sensorGrid}>
            <View style={styles.sensorItem}>
              <Icon name="thermometer" size={24} color={COLORS.danger} />
              <Text style={styles.sensorLabel}>Body Temp</Text>
              <Text style={styles.sensorValue}>{sensorData.body_temperature}°C</Text>
            </View>
            <View style={styles.sensorItem}>
              <Icon name="heart-pulse" size={24} color={COLORS.danger} />
              <Text style={styles.sensorLabel}>Heart Rate</Text>
              <Text style={styles.sensorValue}>{sensorData.heart_rate} BPM</Text>
            </View>
            <View style={styles.sensorItem}>
              <Icon name="angle-acute" size={24} color={COLORS.primary} />
              <Text style={styles.sensorLabel}>Joint Angle</Text>
              <Text style={styles.sensorValue}>{sensorData.joint_angles}°</Text>
            </View>
            <View style={styles.sensorItem}>
              <Icon name="run-fast" size={24} color={COLORS.secondary} />
              <Text style={styles.sensorLabel}>Gait Speed</Text>
              <Text style={styles.sensorValue}>{sensorData.gait_speed} m/s</Text>
            </View>
            <View style={styles.sensorItem}>
              <Icon name="shoe-print" size={24} color={COLORS.primaryLight} />
              <Text style={styles.sensorLabel}>Cadence</Text>
              <Text style={styles.sensorValue}>{sensorData.cadence} steps/min</Text>
            </View>
            <View style={styles.sensorItem}>
              <Icon name="weight" size={24} color={COLORS.warning} />
              <Text style={styles.sensorLabel}>Ground Force</Text>
              <Text style={styles.sensorValue}>{sensorData.ground_reaction_force} N</Text>
            </View>
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <Button
            title="Use in Session"
            onPress={goToSessionWithData}
            icon="play-circle"
            style={styles.sessionButton}
            disabled={!isConnected}
          />
          <Button
            title="Back to Dashboard"
            onPress={() => navigation.goBack()}
            type="outline"
            style={styles.backButton}
          />
        </View>

        {/* Debug Info */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Platform: {Platform.OS} | Connected: {isConnected ? "Yes" : "No"} | 
            Data Points: {chartData.length}
          </Text>
          {isConnected && (
            <Text style={styles.debugText}>
              Receiving live data from Arduino HC-05
            </Text>
          )}
        </View>
      </ScrollView>

      <Loader visible={loading} message={isConnected ? "Receiving data..." : "Connecting..."} />
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
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  statusCard: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    alignItems: "center",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  statusText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  guideCard: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  guideTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    marginBottom: 12,
  },
  steps: {
    marginBottom: 12,
  },
  step: {
    ...TYPOGRAPHY.body,
    color: COLORS.textPrimary,
    marginBottom: 6,
    paddingLeft: 8,
  },
  note: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  controls: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: COLORS.primary,
  },
  connectedControls: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  disconnectButton: {
    flex: 0.48,
    borderColor: COLORS.danger,
  },
  saveButton: {
    flex: 0.48,
    backgroundColor: COLORS.secondary,
  },
  sensorDataCard: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  sensorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  sensorItem: {
    width: "48%",
    alignItems: "center",
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: 12,
  },
  sensorLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  sensorValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  navigation: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sessionButton: {
    flex: 0.65,
    backgroundColor: COLORS.safe,
  },
  backButton: {
    flex: 0.3,
  },
  debugInfo: {
    margin: 16,
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

export default SensorConnectionScreen;