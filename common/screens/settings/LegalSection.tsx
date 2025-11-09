import React from "react";
import { StyleSheet, TouchableOpacity, Linking } from "react-native";

import { Box, Text, useTheme } from "@common/components/theme";

type LegalSectionProps = {
    appVersion?: string;
};

export function LegalSection({ appVersion = "1.0.0" }: LegalSectionProps) {
    const theme = useTheme();

    const handleOpenPrivacyPolicy = async () => {
        const url = "https://htmlpreview.github.io/?https://gist.githubusercontent.com/RohanBasukala15/07bb96256b56566a4fbac6d8c9930758/raw/73f6e1db6ce4734fe4ce2ff7052a0eff15c17730/privacy-policy.html";
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
            await Linking.openURL(url);
        }
    };

  const handleOpenTerms = async () => {
    const url = "https://htmlpreview.github.io/?https://gist.githubusercontent.com/RohanBasukala15/4023ec2eed37bbb41409cbdc6f554ce8/raw/8dbc056fa68984e6237b2d1851de5bc2fdd3d128/terms.html";
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

    return (
        <Box
            marginBottom="l"
            padding="m"
            borderRadius="m"
            style={{
                backgroundColor: theme.colors.white,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
            }}>
            <Text variant="h4" marginBottom="m" color="textDefault">
                Legal & About
            </Text>

            <TouchableOpacity onPress={handleOpenPrivacyPolicy} style={styles.linkButton}>
                <Text variant="default" color="primary">
                    📄 Privacy Policy
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleOpenTerms} style={styles.linkButton}>
                <Text variant="default" color="primary">
                    📋 Terms & Conditions
                </Text>
            </TouchableOpacity>

            <Box marginTop="m" paddingTop="m" style={{ borderTopWidth: 1, borderTopColor: theme.colors.borderSubdued }}>
                <Text variant="caption" color="textSubdued" textAlign="center">
                    My Aura Log v{appVersion}
                </Text>
                <Text variant="caption" color="textSubdued" textAlign="center" marginTop="xs">
                    Made with ☕ and care
                </Text>
            </Box>
        </Box>
    );
}

const styles = StyleSheet.create({
    linkButton: {
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
});

