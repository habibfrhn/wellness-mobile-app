import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import { colors, lineHeights, radius, spacing, typography } from "../../theme/tokens";

type PolicySectionProps = {
  title: string;
  body?: string;
  intro?: string;
  bullets?: string[];
  children?: React.ReactNode;
};

function PolicySection({ title, body, intro, bullets, children }: PolicySectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {body ? <Text style={styles.bodyText}>{body}</Text> : null}
      {intro ? <Text style={styles.bodyText}>{intro}</Text> : null}
      {bullets?.map((bullet) => (
        <View key={`${title}-${bullet}`} style={styles.bulletRow}>
          <Text style={styles.bulletMarker}>{"•"}</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
      {children}
    </View>
  );
}

export default function PrivacyPolicyContent() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>{id.account.privacy}</Text>
        <Text style={styles.title}>{id.account.privacyPolicyScreenTitle}</Text>
        <Text style={styles.updatedAt}>
          {id.account.privacyPolicyUpdatedAtLabel} {id.account.privacyPolicyUpdatedAtValue}
        </Text>
      </View>

      <View style={styles.contentCard}>
        <PolicySection title={id.account.privacyPolicySummaryTitle} body={id.account.privacyPolicySummaryBody} />

        <PolicySection
          title={id.account.privacyPolicyInfoTitle}
          body={id.account.privacyPolicyInfoIntro}
        >
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>{id.account.privacyPolicyAccountTitle}</Text>
            {id.account.privacyPolicyAccountBullets.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bulletMarker}>{"•"}</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
            <Text style={styles.bodyText}>{id.account.privacyPolicyAccountMethodsIntro}</Text>
            {id.account.privacyPolicyAccountMethods.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bulletMarker}>{"•"}</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
            <Text style={styles.bodyText}>{id.account.privacyPolicyGoogleIntro}</Text>
            {id.account.privacyPolicyGoogleBullets.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bulletMarker}>{"•"}</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>{id.account.privacyPolicyUsageTitle}</Text>
            {id.account.privacyPolicyUsageBullets.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bulletMarker}>{"•"}</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>{id.account.privacyPolicyDeviceTitle}</Text>
            {id.account.privacyPolicyDeviceBullets.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bulletMarker}>{"•"}</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        </PolicySection>

        <PolicySection title={id.account.privacyPolicyUseTitle} bullets={id.account.privacyPolicyUseBullets} />
        <PolicySection
          title={id.account.privacyPolicySharingTitle}
          body={id.account.privacyPolicySharingIntro}
          intro={id.account.privacyPolicySharingBody}
          bullets={id.account.privacyPolicySharingBullets}
        />
        <PolicySection title={id.account.privacyPolicySecurityTitle} body={id.account.privacyPolicySecurityBody} />
        <PolicySection
          title={id.account.privacyPolicyRightsTitle}
          body={id.account.privacyPolicyRightsIntro}
          bullets={id.account.privacyPolicyRightsBullets}
        />
        <PolicySection title={id.account.privacyPolicyChildrenTitle} body={id.account.privacyPolicyChildrenBody} />
        <PolicySection title={id.account.privacyPolicyInternationalTitle} body={id.account.privacyPolicyInternationalBody} />
        <PolicySection title={id.account.privacyPolicyChangesTitle} body={id.account.privacyPolicyChangesBody} />
        <PolicySection title={id.account.privacyPolicyContactTitle} body={id.account.privacyPolicyContactBody}>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>{id.account.privacyPolicyContactEmailLabel}:</Text>
            <Text style={styles.contactValue}>{id.account.privacyPolicyContactEmailValue}</Text>
          </View>
        </PolicySection>
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
    maxWidth: 860,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  eyebrow: {
    fontSize: typography.small,
    lineHeight: lineHeights.normal,
    color: colors.secondary,
    fontWeight: "700",
  },
  title: {
    fontSize: typography.h2,
    lineHeight: 30,
    color: colors.text,
    fontWeight: "800",
  },
  updatedAt: {
    fontSize: typography.small,
    lineHeight: lineHeights.normal,
    color: colors.mutedText,
  },
  contentCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.title,
    lineHeight: 26,
    fontWeight: "800",
    color: colors.text,
  },
  subsection: {
    gap: spacing.xs,
  },
  subsectionTitle: {
    fontSize: typography.body,
    lineHeight: lineHeights.relaxed,
    fontWeight: "700",
    color: colors.text,
  },
  bodyText: {
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.text,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  bulletMarker: {
    width: typography.body,
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.text,
    textAlign: "center",
  },
  bulletText: {
    flex: 1,
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.text,
  },
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  contactLabel: {
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.text,
    fontWeight: "700",
  },
  contactValue: {
    fontSize: typography.body,
    lineHeight: 26,
    color: colors.secondary,
  },
});
