import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

import { Box, Text, useTheme } from "@common/components/theme";

type LegalSectionProps = {
    appVersion?: string;
};

export function LegalSection({ appVersion = "1.0.0" }: LegalSectionProps) {
    const theme = useTheme();
    const router = useRouter();

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

            <TouchableOpacity onPress={() => router.push("/(home)/privacy-policy")} style={styles.linkButton}>
                <Text variant="default" color="primary">
                    📄 Privacy Policy
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(home)/terms")} style={styles.linkButton}>
                <Text variant="default" color="primary">
                    📋 Terms & Conditions
                </Text>
            </TouchableOpacity>

            <Box marginTop="m" paddingTop="m" style={{ borderTopWidth: 1, borderTopColor: theme.colors.borderSubdued }}>
                <Text variant="caption" color="textSubdued" textAlign="center">
                    My Aura Log v{appVersion}
                </Text>
                <Text variant="caption" color="textSubdued" textAlign="center" marginTop="xs">
                    Your aura, brewed with ☕💜
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

