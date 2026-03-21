import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import { colors, spacing, typography } from "../../theme/tokens";

type TermsSectionProps = {
  title: string;
  body?: string;
  bodySecondary?: string;
  bullets?: string[];
  children?: React.ReactNode;
};

function TermsSection({ title, body, bodySecondary, bullets, children }: TermsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {body ? <Text style={styles.bodyText}>{body}</Text> : null}
      {bodySecondary ? <Text style={styles.bodyText}>{bodySecondary}</Text> : null}
      {bullets ? (
        <View style={styles.bulletList}>
          {bullets.map((bullet) => (
            <View key={`${title}-${bullet}`} style={styles.bulletRow}>
              <Text style={styles.bulletMarker}>{"•"}</Text>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export default function TermsConditionsContent() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.documentCard}>
        <View style={styles.header}>
          <Text style={styles.title}>{id.account.termsScreenTitle}</Text>
          <Text style={styles.updatedAt}>
            {id.account.termsUpdatedAtLabel} {id.account.termsUpdatedAtValue}
          </Text>
        </View>

        <TermsSection
          title={id.account.termsGeneralTitle}
          body={id.account.termsGeneralBody}
          bodySecondary={id.account.termsGeneralBodySecondary}
        />
        <TermsSection title={id.account.termsDefinitionsTitle} bullets={id.account.termsDefinitionsBullets} />
        <TermsSection title={id.account.termsLicenseTitle} body={id.account.termsLicenseBody} />
        <TermsSection title={id.account.termsBehaviorTitle} body={id.account.termsBehaviorIntro} bullets={id.account.termsBehaviorBullets} />
        <TermsSection title={id.account.termsIpTitle} body={id.account.termsIpBody} />
        <TermsSection title={id.account.termsDisclaimerTitle} body={id.account.termsDisclaimerBody} />
        <TermsSection title={id.account.termsLiabilityTitle} body={id.account.termsLiabilityBody} />
        <TermsSection title={id.account.termsLawTitle} body={id.account.termsLawBody} />
        <TermsSection title={id.account.termsChangesTitle} body={id.account.termsChangesBody} />
        <TermsSection title={id.account.termsContactTitle} body={id.account.termsContactBody}>
          <Text style={styles.bodyText}>
            <Text style={styles.contactLabel}>{id.account.termsContactEmailLabel}: </Text>
            <Text style={styles.contactValue}>{id.account.termsContactEmailValue}</Text>
          </Text>
        </TermsSection>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    width: "100%",
    alignSelf: "center",
    maxWidth: 720,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  documentCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.xl,
    gap: spacing.xl,
    boxShadow: `0px 10px 30px ${colors.text}10`,
    elevation: 2,
  },
  header: {
    gap: spacing.xs,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    color: colors.primary,
    fontWeight: "800",
  },
  updatedAt: {
    fontSize: typography.small,
    lineHeight: 24,
    color: colors.mutedText,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.text,
  },
  bodyText: {
    fontSize: typography.body,
    lineHeight: 27,
    color: colors.secondaryText,
  },
  bulletList: {
    gap: spacing.sm,
    paddingLeft: spacing.xs,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: spacing.xs,
  },
  bulletMarker: {
    width: spacing.md,
    fontSize: typography.body,
    lineHeight: 27,
    color: colors.secondaryText,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.body,
    lineHeight: 27,
    color: colors.secondaryText,
    paddingRight: spacing.xs,
  },
  contactLabel: {
    fontWeight: "700",
    color: colors.text,
  },
  contactValue: {
    color: colors.secondary,
  },
});
