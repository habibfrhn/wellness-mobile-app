import React from "react";
import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";

type LandingScreenProps = {
  navigation: NavigationProp<ParamListBase>;
};

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const handlePrimaryPress = () => {
    // TODO: Confirm route name if "Auth" differs in navigator config.
    navigation.navigate("Auth");
  };

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.headline}>
          Ritual malam 15 menit untuk menutup hari dengan tenang.
        </Text>

        <Text style={styles.subtext}>
          Tanpa iklan. Tanpa scrolling. Tanpa overstimulation.
        </Text>

        <Pressable onPress={handlePrimaryPress} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Coba Gratis (Beta)</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Auth")}>
          <Text style={styles.secondaryButtonText}>Masuk</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
  },
  container: {
    width: "100%",
    maxWidth: 480,
    alignItems: "center",
    gap: 16,
  },
  headline: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },
  subtext: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    color: "#4B5563",
    marginBottom: 8,
  },
  primaryButton: {
    width: "100%",
    maxWidth: 320,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
});
