import React, { useState } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

import { Box, Text, useTheme } from "@common/components/theme";
import { LegalDocumentModal } from "./LegalDocumentModal";

type LegalSectionProps = {
    appVersion?: string;
};

export function LegalSection({ appVersion = "1.0.0" }: LegalSectionProps) {
    const theme = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [documentType, setDocumentType] = useState<"privacy" | "terms">("privacy");

    const handleOpenPrivacyPolicy = async () => {
        setDocumentType("privacy");
        setModalVisible(true);
    };

    const handleOpenTerms = async () => {
        setDocumentType("terms");
        setModalVisible(true);
    };

    return (
        <>
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

            <LegalDocumentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                documentType={documentType}
            />
        </>
    );
}

const styles = StyleSheet.create({
    linkButton: {
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
});

