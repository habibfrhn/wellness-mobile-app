import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { id } from "../i18n/strings";
import { colors, spacing, typography } from "../theme/tokens";
import { supabase } from "../services/supabase";

export default function HomeGreetingTitle() {
  const [name, setName] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted || error) {
        return;
      }

      const fullName = (data.user?.user_metadata?.full_name as string | undefined)?.trim() ?? "";
      setName(fullName);
    })();

    return () => {
      mounted = false;
    };
  }, []);

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
