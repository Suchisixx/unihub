import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';

export default function ScheduleTabs({ activeTab, onTabChange }) {
    // Animation values
    const animation = React.useRef(new Animated.Value(activeTab === 'lt' ? 0 : 1)).current;

    // Refs để lấy kích thước thực tế của tab
    const tab1Ref = useRef();
    const tab2Ref = useRef();
    const [tabWidth, setTabWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

    React.useEffect(() => {
        Animated.spring(animation, {
            toValue: activeTab === 'lt' ? 0 : 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
        }).start();
    }, [activeTab]);

    // Hàm để lấy kích thước thực tế của tab
    const onTabLayout = (event, tab) => {
        const { width, x } = event.nativeEvent.layout;
        if (tab === 'lt') {
            setTabWidth(width);
            // Vị trí bắt đầu của tab đầu tiên
            if (tab1Ref.current) {
                tab1Ref.current.measure((x, y, width, height, pageX, pageY) => {
                    setTabWidth(width);
                });
            }
        }
    };

    const onContainerLayout = (event) => {
        const { width } = event.nativeEvent.layout;
        setContainerWidth(width);
    };

    // Tính toán vị trí chính xác dựa trên kích thước thực tế
    const translateX = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [4, containerWidth / 2 + 4], // 4 là padding của container
    });

    const handleTabPress = (tab) => {
        onTabChange(tab);
    };

    return (
        <View style={styles.container} onLayout={onContainerLayout}>
            {/* Background tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    ref={tab1Ref}
                    style={[styles.tab, activeTab === 'lt' && styles.activeTab]}
                    onPress={() => handleTabPress('lt')}
                    activeOpacity={0.7}
                    onLayout={(e) => onTabLayout(e, 'lt')}
                >
                    <Text style={[styles.tabText, activeTab === 'lt' && styles.activeTabText]}>
                        📚 Lý Thuyết
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    ref={tab2Ref}
                    style={[styles.tab, activeTab === 'th' && styles.activeTab]}
                    onPress={() => handleTabPress('th')}
                    activeOpacity={0.7}
                    onLayout={(e) => onTabLayout(e, 'th')}
                >
                    <Text style={[styles.tabText, activeTab === 'th' && styles.activeTabText]}>
                        🔬 Thực Hành
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Animated indicator */}
            <Animated.View
                style={[
                    styles.indicator,
                    {
                        transform: [{ translateX }],
                        backgroundColor: activeTab === 'lt' ? '#2563EB' : '#059669',
                        width: containerWidth / 2 - 8, // Trừ đi padding
                    }
                ]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        position: 'relative',
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 4,
        position: 'relative',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    activeTab: {
        // Background sẽ được handle bởi indicator
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
    },
    activeTabText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    indicator: {
        position: 'absolute',
        top: 15,
        bottom: 15,
        borderRadius: 8,
        backgroundColor: '#2563EB',
        zIndex: 1,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
});