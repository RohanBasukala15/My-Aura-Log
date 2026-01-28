import React from "react";
import { ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { Box, Text, useTheme } from "@common/components/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

function PrivacyPolicy() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.backgroundDefault }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <Box padding="m" paddingTop="xxxl">
        {/* Header */}
        <Box flexDirection="row" alignItems="center" marginBottom="xl">
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.textDefault} />
          </TouchableOpacity>
          <Text variant="h3" color="textDefault" style={{ flex: 1, marginLeft: 8 }}>
            Privacy Policy
          </Text>
        </Box>

        <Text variant="caption" color="textSubdued" marginBottom="l">
          Last Updated: January 2026
        </Text>

        <Section title="Introduction">
          My Aura Log (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Section>

        <Section title="Information We Collect">
          <SubSection title="Personal Information You Provide" />
          <Bullet text="Journal Entries: The thoughts, moods, and emotions you record in the app" />
          <Bullet text="Mood Data: Your mood selections and emotional state tracking" />
          <Bullet text="Device Information: Device ID for app functionality" />
          <Bullet text="Referral Program: If you use the referral feature, we collect your referral code, device ID, whether you were referred by someone, and referral counts to run the program and grant rewards" />
          <SubSection title="Automatically Collected Information" />
          <Bullet text="Usage Data: How you interact with the app" />
          <Bullet text="Device Information: Device type, operating system, and app version" />
          <Bullet text="Analytics Data: App performance and crash reports (anonymous)" />
        </Section>

        <Section title="How We Use Your Information">
          We use your information to:
        </Section>
        <Bullet text="Provide AI-powered insights on your journal entries (via OpenAI)" />
        <Bullet text="Track your mood patterns and trends" />
        <Bullet text="Process premium purchases (via RevenueCat)" />
        <Bullet text="Run the referral program and grant rewards (when you participate)" />
        <Bullet text="Improve app functionality and user experience" />
        <Bullet text="Send you notifications (if enabled)" />

        <Section title="Data Storage">
          <Bullet text="Local Storage: Journal entries are stored locally on your device" />
          <Bullet text="Firebase: Referral program data (device ID, referral codes, referral relationships) and analytics" />
          <Bullet text="AI Processing: Journal text is sent to OpenAI for analysis (not stored permanently)" />
        </Section>

        <Section title="Third-Party Services">
          We use the following third-party services:
        </Section>
        <SubSection title="OpenAI" />
        <Bullet text="Purpose: Generate AI insights from your journal entries" />
        <Bullet text="Data Shared: Journal text content" />
        <Bullet text="Privacy Policy: openai.com/policies/privacy-policy" />
        <SubSection title="RevenueCat" />
        <Bullet text="Purpose: Process in-app purchases" />
        <Bullet text="Data Shared: Purchase transactions, device ID" />
        <SubSection title="Firebase (Google)" />
        <Bullet text="Purpose: Referral program and analytics" />
        <Bullet text="Data Shared: Device ID, referral codes, referral relationships, usage analytics" />
        <Bullet text="Privacy Policy: firebase.google.com/support/privacy" />

        <Section title="Data Security">
          We implement industry-standard security measures:
        </Section>
        <Bullet text="Local data encryption" />
        <Bullet text="Secure API communications (HTTPS)" />
        <Bullet text="No storage of sensitive payment information" />
        <Bullet text="Device-level security (passcode/biometric protection)" />

        <Section title="Your Rights">
          You have the right to:
        </Section>
        <Bullet text="Access: View all data we collect about you" />
        <Bullet text="Delete: Remove all your data from our systems" />
        <Bullet text="Export: Download your journal entries" />
        <Bullet text="Opt-Out: Disable AI analysis and notifications" />
        <SubSection title="How to Exercise Your Rights" />
        <Bullet text="Delete All Data: Use the &quot;Clear All Data&quot; option in Settings" />
        <Bullet text="Disable AI: Simply save entries without AI analysis" />
        <Bullet text="Disable Notifications: Toggle off in Settings" />

        <Section title="Children's Privacy">
          My Aura Log is not intended for children under 13. We do not knowingly collect data from children under 13. If you believe we have collected data from a child under 13, please contact us immediately.
        </Section>

        <Section title="Data Retention">
          <Bullet text="Journal Entries: Stored locally until you delete them" />
          <Bullet text="Referral Data: Stored in Firebase to operate the referral program; retained while you use the app" />
          <Bullet text="AI Processing: Journal text is not stored by OpenAI after processing" />
        </Section>

        <Section title="International Users">
          Your data may be processed in the United States or other countries where our service providers operate. By using the app, you consent to this transfer.
        </Section>

        <Section title="Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of significant changes via in-app notification and updating the &quot;Last Updated&quot; date.
        </Section>

        <Section title="Contact Us">
          If you have questions about this Privacy Policy, contact us at: myauralog@gmail.com
        </Section>

        <Section title="Your Consent">
          By using My Aura Log, you consent to this Privacy Policy.
        </Section>

        <Section title="Specific Permissions">
          <SubSection title="iOS Permissions" />
          <Bullet text="Notifications: To send daily journal reminders (optional)" />
          <Bullet text="Storage: To save journal entries locally" />
          <SubSection title="Android Permissions" />
          <Bullet text="Notifications: To send daily journal reminders (optional)" />
          <Bullet text="Storage: To save journal entries locally" />
        </Section>

        <Text variant="caption" color="textSubdued" marginTop="l" marginBottom="xxl">
          This privacy policy complies with GDPR, CCPA, Apple App Store Guidelines, and Google Play Store Guidelines.
        </Text>
      </Box>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <Box marginBottom="m">
      <Text variant="h5" color="textDefault" marginBottom="s" fontWeight="600">
        {title}
      </Text>
      {typeof children === "string" ? (
        <Text variant="default" color="textSubdued" lineHeight={22}>
          {children}
        </Text>
      ) : (
        <Box>{children}</Box>
      )}
    </Box>
  );
}

function SubSection({ title }: { title: string }) {
  return (
    <Text variant="default" color="textDefault" fontWeight="500" marginTop="s" marginBottom="xs">
      {title}
    </Text>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <Text variant="default" color="textSubdued" marginBottom="xs" paddingLeft="m" lineHeight={22}>
      • {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1 },
  backButton: { padding: 8, marginLeft: -8 },
});

export default PrivacyPolicy;
