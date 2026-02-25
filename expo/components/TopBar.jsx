import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
    Pressable,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronDown, X } from "lucide-react-native";
import { useSemester } from "../context/semesterContext";

export default function TopBar() {
    const { years, selectedSemester, setSelectedSemester, loading } = useSemester();
    const [visible, setVisible] = useState(false);

    // Sắp xếp years theo year_id tăng dần
    const sortedYears = useMemo(() => {
        return [...(years || [])].sort((a, b) => a.year_id - b.year_id);
    }, [years]);

    // Tìm year tương ứng với semester đang chọn
    const currentSelectedYear = useMemo(() => {
        if (!selectedSemester || !sortedYears || sortedYears.length === 0) return null;
        return sortedYears.find(y => y.year_id === selectedSemester.year_id);
    }, [sortedYears, selectedSemester]);

    // Logic hiển thị label
    const selectedLabel = useMemo(() => {
        if (loading) return "Đang tải...";
        if (selectedSemester && currentSelectedYear)
            return `${currentSelectedYear.name} - ${selectedSemester.name}`;
        if (sortedYears && sortedYears.length > 0) return "Chọn năm & học kỳ";
        return "Chưa có dữ liệu";
    }, [loading, selectedSemester, currentSelectedYear, sortedYears]);

    // Kiểm tra có dữ liệu
    const hasData = sortedYears && sortedYears.length > 0;

    // Tạo dữ liệu cho FlatList với phân cấp (năm và học kỳ)
    const yearSemesterData = useMemo(() => {
        return sortedYears.flatMap(year => [
            { type: 'year', yearId: year.year_id, label: `${year.name || `Năm ${year.year_id}`}` },
            ...year.semesters.map(sem => ({
                type: 'semester',
                yearId: year.year_id,
                semId: sem.sem_id,
                label: `${year.name || `Năm ${year.year_id}`} - ${sem.name}`,
            })),
        ]);
    }, [sortedYears]);

    // Render item cho FlatList
    const renderItem = ({ item }) => {
        if (item.type === 'year') {
            return (
                <View style={styles.yearHeader}>
                    <Text style={styles.yearTitle}>{item.label}</Text>
                </View>
            );
        }
        return (
            <TouchableOpacity
                style={[
                    styles.option,
                    selectedSemester?.sem_id === item.semId && styles.selectedOption,
                ]}
                onPress={() => {
                    setSelectedSemester(item.yearId, item.semId);
                    setVisible(false);
                }}
            >
                <Text style={[
                    styles.optionText,
                    selectedSemester?.sem_id === item.semId && styles.selectedOptionText,
                ]}>{item.label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>UniHub</Text>

                <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setVisible(true)}
                    activeOpacity={0.8}
                    disabled={loading || !hasData}
                >
                    <Text style={styles.dropdownText} numberOfLines={1}>
                        {selectedLabel}
                    </Text>
                    {loading ? (
                        <ActivityIndicator size="small" color="#6B7280" />
                    ) : hasData ? (
                        <ChevronDown color="#6B7280" size={18} />
                    ) : null}
                </TouchableOpacity>

                <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
                    <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
                        <Pressable style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Chọn năm & học kỳ</Text>
                                <TouchableOpacity onPress={() => setVisible(false)}>
                                    <X color="#6B7280" size={22} />
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={yearSemesterData}
                                keyExtractor={(item) => `${item.yearId}_${item.type === 'year' ? 'header' : item.semId}`}
                                renderItem={renderItem}
                                ListEmptyComponent={
                                    <Text style={styles.emptyListText}>Bạn chưa thêm năm học/học kỳ nào.</Text>
                                }
                            />
                        </Pressable>
                    </Pressable>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: "#fff"
    },
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB"
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#111827"
    },
    dropdownButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 12,
        minWidth: 160,
        maxWidth: 220
    },
    dropdownText: {
        flex: 1,
        color: "#374151",
        fontSize: 14,
        marginRight: 10,
        fontWeight: "500"
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center"
    },
    modalContainer: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 0,
        maxHeight: "70%",
        overflow: "hidden"
    },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
    modalTitle: { fontSize: 17, fontWeight: "600", color: "#111" },
    option: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
    selectedOption: { backgroundColor: "#EFF6FF" },
    optionText: { fontSize: 15, color: "#374151" },
    selectedOptionText: { color: "#2563EB", fontWeight: "600" },
    emptyListText: { padding: 20, textAlign: "center", color: "#9CA3AF", fontStyle: "italic" },
    yearHeader: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: "#F9FAFB",
    },
    yearTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
});