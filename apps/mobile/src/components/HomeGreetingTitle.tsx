import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { id } from "../i18n/strings";
import { colors, spacing, typography } from "../theme/tokens";
import { supabase } from "../services/supabase";

export default function HomeGreetingTitle() {
  const [name, setName] = useState("");

  const loadGreetingName = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return;
    }

    const fullName = (data.user?.user_metadata?.full_name as string | undefined)?.trim() ?? "";
    setName(fullName);
  }, []);

  useEffect(() => {
    void loadGreetingName();
  }, [loadGreetingName]);

  useFocusEffect(
    useCallback(() => {
      void loadGreetingName();
    }, [loadGreetingName]),
  );

  const greetingText = useMemo(() => {
    if (!name) {
      return id.home.greetingNoName;
    }

    return id.home.greetingWithName.replace("{name}", name);
  }, [name]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{greetingText}</Text>
      <Text style={styles.subtitle}>{id.home.greetingSubtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    gap: spacing.xs / 2,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.small,
  },
});
