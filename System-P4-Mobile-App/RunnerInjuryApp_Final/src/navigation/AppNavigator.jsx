// src/navigation/AppNavigator.js
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { COLORS } from "../utils/constants";
import { useAuth } from "../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SessionScreen from "../screens/SessionScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Debug component to show auth state
function AuthDebug({ isAuthenticated, userData }) {
  return (
    <View
      style={{
        padding: 10,
        backgroundColor: COLORS.primary + "10",
        margin: 10,
        borderRadius: 8,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          color: COLORS.textSecondary,
          fontFamily: "monospace",
        }}
      >
        DEBUG: Auth={isAuthenticated ? "YES" : "NO"}, User=
        {userData?.name || "None"}, Type={userData?.type || "None"}
      </Text>
    </View>
  );
}

// Tab Navigator for main app
function MainTabs() {
  const { userData, isAuthenticated } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "account" : "account-outline";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.cardBackground,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        headerStyle: {
          backgroundColor: COLORS.cardBackground,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTitleStyle: {
          color: COLORS.textPrimary,
          fontWeight: "600",
        },
        headerTintColor: COLORS.primary,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: true,
          title: "Dashboard",
          headerTitleAlign: "center",
          headerRight: () => (
            <AuthDebug isAuthenticated={isAuthenticated} userData={userData} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: "Profile",
          headerTitleAlign: "center",
          headerRight: () => (
            <AuthDebug isAuthenticated={isAuthenticated} userData={userData} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Loading screen component
function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
      }}
    >
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ marginTop: 16, color: COLORS.textSecondary }}>
        Checking authentication...
      </Text>
    </View>
  );
}

// Debug screen for testing auth
function DebugScreen({ navigation }) {
  const { isAuthenticated, userData, logout } = useAuth();

  const checkStorage = async () => {
    const token = await AsyncStorage.getItem("authToken");
    const user = await AsyncStorage.getItem("userData");
    alert(
      `Token: ${token ? "Exists" : "Missing"}\nUser: ${
        user ? "Exists" : "Missing"
      }`
    );
  };

  const forceLogout = async () => {
    await AsyncStorage.clear();
    alert("Storage cleared. Restart app.");
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: COLORS.background }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>
        Debug Screen
      </Text>

      <View
        style={{
          marginBottom: 20,
          padding: 15,
          backgroundColor: COLORS.cardBackground,
          borderRadius: 10,
        }}
      >
        <Text style={{ fontWeight: "bold" }}>Auth State:</Text>
        <Text>isAuthenticated: {isAuthenticated ? "TRUE" : "FALSE"}</Text>
        <Text>User ID: {userData?.id || "None"}</Text>
        <Text>User Name: {userData?.name || "None"}</Text>
        <Text>User Type: {userData?.type || "None"}</Text>
      </View>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: COLORS.primary,
          borderRadius: 10,
          marginBottom: 10,
        }}
        onPress={checkStorage}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Check AsyncStorage
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: COLORS.danger,
          borderRadius: 10,
          marginBottom: 10,
        }}
        onPress={forceLogout}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Force Clear Storage
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: COLORS.secondary,
          borderRadius: 10,
        }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { isAuthenticated, loading, userData } = useAuth();
  const [debugMode, setDebugMode] = useState(false);

  // Log authentication state for debugging
  useEffect(() => {
    console.log("=== AUTH STATE UPDATE ===");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("Loading:", loading);
    console.log("User Data:", userData);
    console.log("Timestamp:", new Date().toISOString());
    console.log("=========================");
  }, [isAuthenticated, loading, userData]);

  // Show loading screen while checking auth status
  if (loading) {
    return <LoadingScreen />;
  }

  // For debugging - show debug screen
  if (debugMode) {
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Debug"
            component={DebugScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.cardBackground,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: COLORS.primary,
          headerBackTitle: "Back",
          headerTitleStyle: {
            color: COLORS.textPrimary,
            fontWeight: "600",
          },
        }}
      >
        {!isAuthenticated ? (
          // Auth Screens - User is NOT authenticated
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                headerShown: false,
                // When user logs out, replace the stack
                animationTypeForReplace: "pop",
              }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: "Create Account",
                headerStyle: {
                  backgroundColor: COLORS.cardBackground,
                },
                headerTintColor: COLORS.textPrimary,
                headerBackTitle: "Back",
              }}
            />
          </>
        ) : (
          // Main App Screens - User IS authenticated
          <>
            <Stack.Screen
              name="MainApp"
              component={MainTabs}
              options={{
                headerShown: false,
                // Prevent going back to login
                gestureEnabled: false,
                headerLeft: null,
              }}
            />
            <Stack.Screen
              name="Session"
              component={SessionScreen}
              options={{
                title: "Running Session",
                headerStyle: {
                  backgroundColor: COLORS.cardBackground,
                },
                headerTintColor: COLORS.textPrimary,
                headerBackTitle: "Back",
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
