// src/utils/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Get base URL for API calls - UPDATED FIX FOR ANDROID
const getBaseUrl = () => {
  console.log("📱 Platform detected:", Platform.OS);
  console.log("🚀 Development mode:", __DEV__);

  // For development - use platform-specific addresses
  if (__DEV__) {
    if (Platform.OS === "android") {
      // ✅ Android emulator - MUST use 10.0.2.2
      console.log("📱 Using Android emulator address: 10.0.2.2");
      return "https://mazen-atlam-runners-injury-prediction-system-api.hf.space/api/v1.0";
    } else if (Platform.OS === "ios") {
      // ✅ iOS simulator - localhost works
      console.log("📱 Using iOS simulator address: localhost");
      return "https://mazen-atlam-runners-injury-prediction-system-api.hf.space/api/v1.0";
    } else {
      // Web or other platforms
      console.log("📱 Using Web/other platform address: localhost");
      return "https://mazen-atlam-runners-injury-prediction-system-api.hf.space/api/v1.0";
    }
  }
  // For production
  else {
    return "https://mazen-atlam-runners-injury-prediction-system-api.hf.space/api/v1.0";
  }
};

const API_BASE_URL = getBaseUrl();
console.log("🌐 FINAL API Base URL:", API_BASE_URL);

// Add a timeout to fetch requests
const fetchWithTimeout = (url, options, timeout = 8000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]);
};

// Helper function for API calls
export const apiCall = async (
  endpoint,
  method = "GET",
  data = null,
  requiresAuth = true
) => {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`🌐 API Call: ${method} ${url}`);

  // For debugging, let's see what platform we're on
  console.log("📱 Current Platform:", Platform.OS);

  try {
    const headers = {
      "Content-Type": "application/json",
    };

    // Add authentication if required
    if (requiresAuth) {
      const token = await AsyncStorage.getItem("authToken");
      console.log("🔐 Token exists:", !!token);
      if (token) {
        console.log(
          "🔐 Token (first 20 chars):",
          token.substring(0, 20) + "..."
        );
        headers.Authorization = `Bearer ${token}`;
      } else {
        console.log("⚠️ No auth token found, but auth is required");
      }
    }

    const config = {
      method,
      headers,
    };

    if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
      config.body = JSON.stringify(data);
      console.log("📤 Request data:", JSON.stringify(data));
    }

    console.log("📡 Sending request with config:", {
      method: config.method,
      url,
      headers: config.headers,
      hasBody: !!config.body,
    });

    // Use timeout for fetch
    const response = await fetchWithTimeout(url, config, 10000);

    console.log(
      `📥 Response status: ${response.status} ${response.statusText}`
    );

    // Check if response is OK
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorData = null;

      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
      } catch (e) {
        console.log("❌ Could not parse error response:", e.message);
      }

      console.error(`❌ API Error2 (${endpoint}):`, errorMessage);
      throw new Error(errorMessage);
    }

    // Try to parse JSON response
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const responseData = await response.json();
        console.log(`✅ API Success (${endpoint}):`, responseData);
        return responseData;
      } else {
        const text = await response.text();
        console.log(`✅ API Success (${endpoint}):`, text);
        return { message: text };
      }
    } catch (parseError) {
      console.error("❌ Error parsing response:", parseError);
      throw new Error("Invalid response format from server");
    }
  } catch (error) {
    console.error(`❌ API Error1 (${endpoint}):`, error.message);

    // Enhanced error messages
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("Network request failed") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Request timeout")
    ) {
      let platformSpecificAdvice = "";

      if (Platform.OS === "android") {
        platformSpecificAdvice =
          "\n\n⚠️ Android Emulator requires 10.0.2.2 (not localhost)" +
          "\n✅ Your current URL: " +
          API_BASE_URL +
          "\n🔧 Troubleshooting:" +
          "\n1. Ensure Flask is running: flask run --host=0.0.0.0 --port=5000" +
          "\n2. Test from your computer: curl http://10.0.2.2:5000/health" +
          '\n3. Check AndroidManifest.xml has: android:usesCleartextTraffic="true"' +
          "\n4. Restart React Native: npm start -- --reset-cache";
      } else if (Platform.OS === "ios") {
        platformSpecificAdvice =
          "\n\n⚠️ iOS Simulator uses localhost" +
          "\n✅ Your current URL: " +
          API_BASE_URL +
          "\n🔧 Troubleshooting:" +
          "\n1. Ensure Flask is running: flask run --host=0.0.0.0 --port=5000" +
          "\n2. Test from your computer: curl http://localhost:5000/health" +
          "\n3. Check if port 5000 is available" +
          "\n4. Restart React Native: npm start -- --reset-cache";
      }

      throw new Error(
        `Cannot connect to server at ${API_BASE_URL}. ${platformSpecificAdvice}`
      );
    }

    throw error;
  }
};

// User API endpoints
export const userAPI = {
  register: (data) => apiCall("/user/register", "POST", data, false),
  login: (data) => apiCall("/user/login", "POST", data, false),
  logout: () => apiCall("/user/logout", "POST", null, true),

  // Test endpoint for debugging
  health: () => apiCall("/health", "GET", null, false),
};

// Coach API endpoints
export const coachAPI = {
  getAll: () => apiCall("/coach/", "GET"),
  getOne: (id) => apiCall(`/coach/${id}`, "GET"),
  create: (data) => apiCall("/coach/", "POST", data),
  update: (id, data) => apiCall(`/coach/${id}`, "PUT", data),
  delete: (id) => apiCall(`/coach/${id}`, "DELETE"),
};

// Athlete API endpoints
export const athleteAPI = {
  getAll: () => apiCall("/athlete/", "GET"),
  getOne: (id) => apiCall(`/athlete/${id}`, "GET"),
  create: (data) => apiCall("/athlete/", "POST", data),
  update: (id, data) => apiCall(`/athlete/${id}`, "PUT", data),
  delete: (id) => apiCall(`/athlete/${id}`, "DELETE"),
};

// Session API endpoints
export const sessionAPI = {
  getAll: () => apiCall("/session/", "GET"),
  getOne: (id) => apiCall(`/session/${id}`, "GET"),
  create: (data) => apiCall("/session/", "POST", data),
  update: (id, data) => apiCall(`/session/${id}`, "PUT", data),
  delete: (id) => apiCall(`/session/${id}`, "DELETE"),
};

// Sensor Data API endpoints
export const sensorDataAPI = {
  getAll: (sessionId) => {
    const endpoint = sessionId
      ? `/sensor_data/?session_id=${sessionId}`
      : "/sensor_data/";
    return apiCall(endpoint, "GET");
  },
  getOne: (id) => apiCall(`/sensor_data/${id}`, "GET"),
  create: (data) => apiCall("/sensor_data/", "POST", data),
  update: (id, data) => apiCall(`/sensor_data/${id}`, "PUT", data),
  delete: (id) => apiCall(`/sensor_data/${id}`, "DELETE"),
};

// AI Model Prediction API
export const predictionAPI = {
  predict: (data) => apiCall("/runners_model/predict", "POST", data),
};

// Debug utility function
export const testBackendConnection = async () => {
  try {
    console.log("🔍 Testing backend connection...");
    console.log("📱 Current Platform:", Platform.OS);
    console.log("🌐 Using URL:", API_BASE_URL);

    // Try to access the health endpoint
    const healthUrl = API_BASE_URL.replace("/api/v1.0", "") + "/health";
    console.log("🔍 Testing health endpoint:", healthUrl);

    const response = await fetchWithTimeout(
      healthUrl,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      5000
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    console.log("✅ Backend is accessible! Response:", text);
    return {
      success: true,
      message: text,
      url: healthUrl,
    };
  } catch (error) {
    console.error("❌ Backend connection test failed:", error.message);

    let suggestion = "";
    if (Platform.OS === "android") {
      suggestion =
        "Troubleshooting steps for Android:\n" +
        "1. Run: curl http://10.0.2.2:5000/health (from your computer)\n" +
        "2. Check AndroidManifest.xml has internet permission\n" +
        '3. Check android:usesCleartextTraffic="true"\n' +
        "4. Ensure backend is running with: flask run --host=0.0.0.0";
    } else {
      suggestion =
        "Troubleshooting steps:\n" +
        "1. Run: curl http://localhost:5000/health (from your computer)\n" +
        "2. Ensure backend is running with: flask run --host=0.0.0.0\n" +
        "3. Check if port 5000 is not in use by another app";
    }

    return {
      success: false,
      message: error.message,
      suggestion: suggestion,
      platform: Platform.OS,
      url: API_BASE_URL,
    };
  }
};

// Quick test function to add to RegisterScreen
export const quickConnectionTest = async () => {
  const result = await testBackendConnection();

  if (result.success) {
    Alert.alert(
      "✅ Connection Successful",
      `Backend is running!\n\nURL: ${result.url}\nResponse: ${result.message}`
    );
  } else {
    Alert.alert(
      "❌ Connection Failed",
      `Cannot connect to: ${result.url}\n\nError: ${result.message}\n\n${result.suggestion}`
    );
  }

  return result;
};

// Export API_BASE_URL for debugging
export { API_BASE_URL };
