import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { id } from "../../i18n/strings";
import { colors, radius, spacing, typography } from "../../theme/tokens";

type PolicySectionProps = {
  title: string;
  body?: string;
  bullets?: string[];
  children?: React.ReactNode;
};

function PolicySection({ title, body, bullets, children }: PolicySectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {body ? <Text style={styles.bodyText}>{body}</Text> : null}
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

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.bulletList}>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <Text style={styles.bulletMarker}>{"•"}</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PrivacyPolicyContent() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.documentCard}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{id.account.privacy}</Text>
          <Text style={styles.title}>{id.account.privacyPolicyScreenTitle}</Text>
          <Text style={styles.updatedAt}>
            {id.account.privacyPolicyUpdatedAtLabel} {id.account.privacyPolicyUpdatedAtValue}
          </Text>
        </View>

        <PolicySection title={id.account.privacyPolicySummaryTitle} body={id.account.privacyPolicySummaryBody} />

        <PolicySection title={id.account.privacyPolicyInfoTitle} body={id.account.privacyPolicyInfoIntro}>
          <View style={styles.subsectionGroup}>
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>{id.account.privacyPolicyAccountTitle}</Text>
              <BulletList items={id.account.privacyPolicyAccountBullets} />
              <Text style={styles.bodyText}>{id.account.privacyPolicyAccountMethodsIntro}</Text>
              <BulletList items={id.account.privacyPolicyAccountMethods} />
              <Text style={styles.bodyText}>{id.account.privacyPolicyGoogleIntro}</Text>
              <BulletList items={id.account.privacyPolicyGoogleBullets} />
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>{id.account.privacyPolicyUsageTitle}</Text>
              <BulletList items={id.account.privacyPolicyUsageBullets} />
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>{id.account.privacyPolicyDeviceTitle}</Text>
              <BulletList items={id.account.privacyPolicyDeviceBullets} />
            </View>
          </View>
        </PolicySection>

        <PolicySection title={id.account.privacyPolicyUseTitle} bullets={id.account.privacyPolicyUseBullets} />

        <PolicySection title={id.account.privacyPolicySharingTitle} body={id.account.privacyPolicySharingIntro}>
          <Text style={styles.bodyText}>{id.account.privacyPolicySharingBody}</Text>
          <BulletList items={id.account.privacyPolicySharingBullets} />
        </PolicySection>

        <PolicySection title={id.account.privacyPolicySecurityTitle} body={id.account.privacyPolicySecurityBody} />

        <PolicySection title={id.account.privacyPolicyRightsTitle} body={id.account.privacyPolicyRightsIntro}>
          <BulletList items={id.account.privacyPolicyRightsBullets} />
        </PolicySection>

        <PolicySection title={id.account.privacyPolicyChildrenTitle} body={id.account.privacyPolicyChildrenBody} />
        <PolicySection title={id.account.privacyPolicyInternationalTitle} body={id.account.privacyPolicyInternationalBody} />
        <PolicySection title={id.account.privacyPolicyChangesTitle} body={id.account.privacyPolicyChangesBody} />

        <PolicySection title={id.account.privacyPolicyContactTitle} body={id.account.privacyPolicyContactBody}>
          <Text style={styles.bodyText}>
            <Text style={styles.contactLabel}>{id.account.privacyPolicyContactEmailLabel}: </Text>
            <Text style={styles.contactValue}>{id.account.privacyPolicyContactEmailValue}</Text>
          </Text>
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
  eyebrow: {
    fontSize: typography.caption,
    lineHeight: 20,
    color: colors.secondary,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
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
  subsectionGroup: {
    gap: spacing.lg,
  },
  subsection: {
    gap: spacing.sm,
  },
  subsectionTitle: {
    fontSize: typography.body,
    lineHeight: 28,
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
