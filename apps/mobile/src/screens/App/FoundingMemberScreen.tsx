import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import FoundingMemberForm from "../../components/FoundingMemberForm";
import { getWebPageContainerStyle, getWebPageTopSpacing, getWebViewport } from "../../constants/webLayout";
import useViewportWidth from "../../hooks/useViewportWidth";
import { id } from "../../i18n/strings";
import type { AppStackParamList } from "../../navigation/types";
import {
  getInitialFoundingMemberFormValues,
  submitFoundingMemberForm,
  type FoundingMemberFormValues,
} from "../../services/foundingMember";
import { supabase } from "../../services/supabase";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<AppStackParamList, "FoundingMember">;

const DESKTOP_PAGE_MAX_WIDTH = 840;
const TABLET_PAGE_MAX_WIDTH = 760;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function FoundingMemberScreen({}: Props) {
  const viewportWidth = useViewportWidth();
  const webViewport = getWebViewport(viewportWidth);
  const [values, setValues] = useState<FoundingMemberFormValues>(() => getInitialFoundingMemberFormValues());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) {
        return;
      }

      const userName = (data.user?.user_metadata?.full_name as string | undefined) ?? "";
      setValues((prev) => ({
        ...prev,
        name: prev.name || userName,
        email: prev.email || (data.user?.email ?? ""),
      }));
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const containerStyle = useMemo(
    () =>
      getWebPageContainerStyle(webViewport, {
        mobile: 480,
        tablet: TABLET_PAGE_MAX_WIDTH,
        desktop: DESKTOP_PAGE_MAX_WIDTH,
      }),
    [webViewport],
  );

  const onChange = <K extends keyof FoundingMemberFormValues>(key: K, value: FoundingMemberFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!values.name.trim()) {
      return id.foundingMember.validation.nameRequired;
    }

    if (!isValidEmail(values.email.trim())) {
      return id.foundingMember.validation.emailInvalid;
    }

    if (!values.sleepIssue.trim() || !values.whyJoin.trim()) {
      return id.foundingMember.validation.textRequired;
    }

    if (
      !values.sleepFrequency ||
      !values.feedbackWillingness ||
      !values.interviewWillingness ||
      !values.paymentWillingness ||
      !values.preferredPrice
    ) {
      return id.foundingMember.validation.optionRequired;
    }

    if (!values.consentToContact) {
      return id.foundingMember.validation.consentRequired;
    }

    return null;
  };

  const onSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await submitFoundingMemberForm(values);

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(id.foundingMember.submitError);
      return;
    }

    setIsSuccess(true);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { paddingTop: getWebPageTopSpacing(webViewport) }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.contentWrap, containerStyle]}>
        <View style={styles.introCard}>
          <Text style={styles.introText}>{id.foundingMember.intro}</Text>
          <Text style={styles.supportText}>{id.foundingMember.supportCopy}</Text>
        </View>

        {isSuccess ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>{id.foundingMember.successTitle}</Text>
            <Text style={styles.successBody}>{id.foundingMember.successBody}</Text>
            <Text style={styles.successBody}>{id.foundingMember.successSubtext}</Text>
          </View>
        ) : (
          <FoundingMemberForm
            values={values}
            onChange={onChange}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  contentWrap: {
    width: "100%",
    alignSelf: "center",
    gap: spacing.md,
  },
  introCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 56,
    gap: spacing.sm,
  },
  introText: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.text,
  },
  supportText: {
    fontSize: typography.small,
    lineHeight: 22,
    color: colors.mutedText,
  },
  successCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.primary}26`,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  successTitle: {
    fontSize: typography.title,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.primary,
  },
  successBody: {
    fontSize: typography.body,
    lineHeight: 24,
    color: colors.text,
  },
});
