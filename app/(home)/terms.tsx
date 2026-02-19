import React from "react";
import { ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import { Box, Text, useTheme } from "@common/components/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

function Terms() {
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
            Terms & Conditions
          </Text>
        </Box>

        <Text variant="caption" color="textSubdued" marginBottom="l">
          Last Updated: January 2026
        </Text>

        <Section title="1. Acceptance of Terms">
          By downloading, installing, or using My Aura Log (&quot;the App&quot;), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the App.
        </Section>

        <Section title="2. Description of Service">
          My Aura Log is a digital journal and mood tracking application that provides: Personal journaling capabilities, mood and emotion tracking, AI-powered insights (optional), trend analysis and visualizations, and premium features (optional paid upgrade).
        </Section>

        <Section title="3. User Accounts and Data">
          <SubSection title="3.1 Your Account" />
          <Bullet text="You are responsible for maintaining the confidentiality of your device access" />
          <Bullet text="All journal entries are stored locally on your device by default" />
          <Bullet text="Firebase is used for the referral program and analytics when you use those features" />
          <SubSection title="3.2 Data Ownership" />
          <Bullet text="You retain full ownership of all journal entries and personal data" />
          <Bullet text="You can export or delete your data at any time" />
          <Bullet text="We do not claim any rights to your journal content" />
        </Section>

        <Section title="4. Acceptable Use">
          You agree NOT to: Use the App for any illegal purpose; attempt to reverse engineer or decompile the App; share your access with others if using premium features; attempt to circumvent any security measures; use the App to harm yourself or others.
        </Section>

        <Section title="5. AI Features and OpenAI">
          <Bullet text="AI insights are powered by OpenAI's GPT models" />
          <Bullet text="Journal text is sent to OpenAI for processing when you request AI analysis" />
          <Bullet text="AI suggestions are for informational purposes only, not medical advice" />
          <Bullet text="You can opt out of AI features at any time" />
          <Bullet text="OpenAI does not store your journal content permanently" />
        </Section>

        <Section title="6. Premium Features">
          <SubSection title="6.1 Purchases" />
          <Bullet text="Premium is available as a one-time lifetime purchase or as a monthly subscription" />
          <Bullet text="Monthly subscriptions renew automatically until you cancel in your device's subscription settings" />
          <Bullet text="Prices are displayed in your local currency" />
          <Bullet text="All purchases are processed through Apple App Store or Google Play Store" />
          <Bullet text="Payment processing is handled by RevenueCat" />
          <SubSection title="6.2 Refunds" />
          <Bullet text="Refund policies are governed by Apple or Google's terms" />
          <Bullet text="Contact Apple or Google directly for refund requests" />
          <Bullet text="We cannot process refunds directly" />
          <Bullet text="For subscriptions: cancel before the next billing date in your device settings to avoid further charges" />
          <SubSection title="6.3 Referral Program" />
          <Text variant="default" color="textSubdued" marginTop="xs" lineHeight={22}>
            We may offer a referral program where you can invite others and earn rewards (such as premium access) when they use the App. Participation is subject to our referral rules. We can change or discontinue the program at any time. Referral-related data is used to operate the program and is described in our Privacy Policy.
          </Text>
        </Section>

        <Section title="7. Disclaimers">
          <SubSection title="7.1 Not Medical Advice" />
          <Text variant="default" color="textDefault" fontWeight="600" marginBottom="s">
            IMPORTANT: My Aura Log is NOT a substitute for professional medical advice, diagnosis, or treatment. The App&apos;s insights, suggestions, and mood tracking features are for informational and self-reflection purposes only.
          </Text>
          <SubSection title="7.2 Mental Health" />
          <Text variant="default" color="textSubdued" marginBottom="s" lineHeight={22}>
            If you are experiencing a mental health crisis or emergency: Call emergency services (911 in US), contact a crisis helpline immediately, or seek help from a licensed mental health professional.
          </Text>
          <SubSection title="7.3 No Warranty" />
          <Text variant="default" color="textSubdued" lineHeight={22}>
            The App is provided &quot;AS IS&quot; without warranties of any kind. We do not guarantee: Uninterrupted or error-free operation; accuracy of AI-generated insights; compatibility with all devices; or permanence of features or availability.
          </Text>
        </Section>

        <Section title="8. Limitation of Liability">
          To the maximum extent permitted by law: We are not liable for any indirect, incidental, or consequential damages; our total liability shall not exceed the amount you paid for premium features (if any); we are not responsible for data loss (backup your data regularly).
        </Section>

        <Section title="9. Data and Privacy">
          <Bullet text="Your privacy is important to us" />
          <Bullet text="See our Privacy Policy for detailed information" />
          <Bullet text="Journal entries are encrypted and stored locally by default" />
          <Bullet text="You can delete all your data at any time through Settings" />
        </Section>

        <Section title="10. Third-Party Services">
          The App integrates with third-party services: OpenAI (for AI-powered insights), RevenueCat (for payment processing), and Firebase (for referral program and analytics). Your use of these services is subject to their respective terms and policies.
        </Section>

        <Section title="11. Notifications">
          <Bullet text="You can enable optional reminder notifications" />
          <Bullet text="You can disable notifications at any time in device settings" />
          <Bullet text="We will not send promotional or marketing notifications" />
        </Section>

        <Section title="12. Intellectual Property">
          <Bullet text="The App, its design, and features are owned by My Aura Log" />
          <Bullet text="You may not copy, modify, or distribute the App" />
          <Bullet text="All trademarks and logos are property of their respective owners" />
        </Section>

        <Section title="13. Changes to Terms">
          We reserve the right to modify these Terms at any time. Changes will be effective upon posting the updated Terms in the App, after providing notice via in-app notification. Continued use of the App constitutes acceptance of new Terms.
        </Section>

        <Section title="14. Termination">
          <Bullet text="You may stop using the App at any time" />
          <Bullet text="We may terminate or suspend access for violations of these Terms" />
          <Bullet text="Upon termination, these Terms remain in effect for applicable sections" />
        </Section>

        <Section title="15. Geographic Restrictions">
          <Bullet text="The App is available worldwide where legally permitted" />
          <Bullet text="Some features may not be available in all countries" />
          <Bullet text="You are responsible for compliance with local laws" />
        </Section>

        <Section title="16. Children's Use">
          The App is not intended for children under 13 years of age. If you are under 13, please do not use the App.
        </Section>

        <Section title="17. Governing Law">
          These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
        </Section>

        <Section title="18. Contact Information">
          For questions about these Terms, contact us at: myauralog@gmail.com
        </Section>

        <Section title="19. Entire Agreement">
          These Terms, together with our Privacy Policy, constitute the entire agreement between you and My Aura Log regarding the use of the App.
        </Section>

        <Section title="20. Severability">
          If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
        </Section>

        <Text variant="default" color="textSubdued" marginTop="l" marginBottom="xxl" fontStyle="italic">
          By using My Aura Log, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
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

export default Terms;
