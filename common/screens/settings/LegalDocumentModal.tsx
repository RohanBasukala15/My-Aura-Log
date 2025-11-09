import React from "react";
import * as WebBrowser from "expo-web-browser";
import { LEGAL_DOCS_CONFIG } from "./LegalDocumentConfig";

type LegalDocumentModalProps = {
    visible: boolean;
    onClose: () => void;
    documentType: "privacy" | "terms";
};

/**
 * Opens legal documents in the device's browser
 * 
 * Benefits:
 * - No package installation needed (uses built-in expo-web-browser)
 * - URLs configured once in LegalDocumentConfig.ts
 * - Update documents on GitHub Pages without updating app
 * - Works on iOS and Android
 */
export function LegalDocumentModal({ visible, onClose, documentType }: LegalDocumentModalProps) {
    
    const url = documentType === "privacy" 
        ? LEGAL_DOCS_CONFIG.privacyPolicyUrl
        : LEGAL_DOCS_CONFIG.termsUrl;

    React.useEffect(() => {
        if (visible) {
            handleOpen();
        }
    }, [visible]);

    const handleOpen = async () => {
        try {
            // Opens in in-app browser on iOS/Android
            await WebBrowser.openBrowserAsync(url, {
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
                controlsColor: "#9B87F5",
            });
        } catch (error) {
            console.error("Error opening document:", error);
        } finally {
            onClose();
        }
    };

    // This component doesn't render any UI - it just triggers the browser
    return null;
}
