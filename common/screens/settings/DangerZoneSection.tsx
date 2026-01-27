import React, { useRef, useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    cancelAnimation,
    interpolateColor,
    interpolate,
    Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { Box, Text, useTheme } from "@common/components/theme";

type DangerZoneSectionProps = {
    onClearData: () => void;
};

const HOLD_DURATION = 2000; // 3 seconds in milliseconds
const LIGHT_ORANGE = "#FFB366"; // Light orange
const DARK_ORANGE = "#FF6B00"; // Darker orange

export function DangerZoneSection({ onClearData }: DangerZoneSectionProps) {
    const theme = useTheme();
    const progress = useSharedValue(0);
    const buttonWidth = useSharedValue(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const animatedProgressStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            progress.value,
            [0, 1],
            [LIGHT_ORANGE, DARK_ORANGE]
        );

        const width = interpolate(
            progress.value,
            [0, 1],
            [0, buttonWidth.value],
            {
                extrapolateRight: "clamp",
            }
        );

        return {
            width,
            backgroundColor,
        };
    });

    const handlePressIn = () => {
        // Cancel any existing animation
        cancelAnimation(progress);

        // Start progress animation
        progress.value = withTiming(1, {
            duration: HOLD_DURATION,
            easing: Easing.linear,
        });

        // Set timer to trigger action and haptic feedback
        timerRef.current = setTimeout(() => {
            // Trigger haptic feedback
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
                // Silently fail if haptics not available
            });

            // Trigger the action
            onClearData();

            // Reset progress
            progress.value = 0;
        }, HOLD_DURATION);
    };

    const handlePressOut = () => {
        // Cancel the timer if user releases early
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        // Cancel animation and reset progress
        cancelAnimation(progress);
        progress.value = withTiming(0, {
            duration: 200,
            easing: Easing.out(Easing.ease),
        });
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            cancelAnimation(progress);
        };
    }, [progress]);

    return (
        <Box
            marginBottom="l"
            padding="m"
            borderRadius="m"
            style={{
                backgroundColor: theme.colors.surfaceCriticalDefault,
                borderWidth: 1,
                borderColor: theme.colors.borderCriticalDefault,
            }}>
            <Text variant="h4" marginBottom="m" color="textCritical">
                Danger Zone
            </Text>
            <Text variant="default" color="textDefault" marginBottom="m">
                Clear all your journal entries. This action cannot be undone. Press the button below for 2 seconds to confirm.
            </Text>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.buttonContainer}>
                <Box
                    onLayout={(event) => {
                        const { width } = event.nativeEvent.layout;
                        buttonWidth.value = width;
                    }}
                    style={[
                        styles.buttonBase,
                        {
                            backgroundColor: LIGHT_ORANGE,
                            borderColor: LIGHT_ORANGE,
                        },
                    ]}>
                    {/* Animated progress overlay */}
                    <Animated.View style={[styles.progressOverlay, animatedProgressStyle]} />

                    {/* Button text */}
                    <Text
                        variant="button"
                        style={styles.buttonText}
                        color="textOnPrimary">
                        Clear All Data
                    </Text>
                </Box>
            </Pressable>
        </Box>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        borderRadius: 8,
        overflow: "hidden",
    },
    buttonBase: {
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
    },
    progressOverlay: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        height: "100%",
    },
    buttonText: {
        position: "relative",
        zIndex: 1,
        fontWeight: "600",
    },
});
