// src/components/Button.js
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { COLORS, TYPOGRAPHY } from "../utils/constants";

const Button = ({
  title,
  onPress,
  style,
  textStyle,
  icon,
  type = "primary",
  loading = false,
  disabled = false,
  iconPosition = "left",
}) => {
  const getButtonStyle = () => {
    switch (type) {
      case "secondary":
        return [styles.button, styles.secondaryButton, style];
      case "outline":
        return [styles.button, styles.outlineButton, style];
      case "text":
        return [styles.button, styles.textButton, style];
      default:
        return [styles.button, styles.primaryButton, style];
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case "outline":
        return [styles.text, styles.outlineText, textStyle];
      case "text":
        return [styles.text, styles.textButtonText, textStyle];
      default:
        return [styles.text, textStyle];
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && styles.disabledButton,
        loading && styles.loadingButton,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={type === "outline" ? COLORS.primary : COLORS.white}
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === "left" && (
            <Icon
              name={icon}
              size={20}
              style={[styles.icon, styles.leftIcon]}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === "right" && (
            <Icon
              name={icon}
              size={20}
              style={[styles.icon, styles.rightIcon]}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  textButton: {
    backgroundColor: "transparent",
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingButton: {
    opacity: 0.8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: "600",
  },
  outlineText: {
    color: COLORS.primary,
  },
  textButtonText: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  icon: {
    marginHorizontal: 4,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default Button;
