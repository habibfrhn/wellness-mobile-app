import React, { useEffect, useRef } from "react";
import { Animated, AccessibilityInfo, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../theme/tokens";

type Props = {
  isActive: boolean;
  style?: ViewStyle;
};

export default function CalmPulse({ isActive, style }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => (reduceMotion.current = !!v))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion.current) return;

    if (isActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulse.stopAnimation();
      pulse.setValue(0);
    }
  }, [isActive, pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.18] });

  return (
    <Animated.View
      style={[
        styles.circle,
        style,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primary,
  },
});
