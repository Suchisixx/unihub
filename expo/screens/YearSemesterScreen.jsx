import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Alert
} from 'react-native';
import { CalendarIcon, Trash2Icon, Edit2Icon, ArrowLeft } from 'lucide-react-native';
import { useSemester } from '../context/semesterContext';
import YearModal from '../components/years/YearModal';
import SemesterModal from '../components/semester/SemesterModal';

export default function YearSemesterScreen({ setCurrentScreen }) {
    // LẤY DỮ LIỆU TỪ CONTEXT
    const {
        years,
        loading: contextLoading,
        fetchYearsAndSemesters,
        selectedSemester,
        deleteYear,
        updateSemester,
        deleteSemester,
    } = useSemester();

    // Khai báo state cho các Modal Thêm nhanh
    const [yearModalVisible, setYearModalVisible] = useState(false);
    const [semesterModalVisible, setSemesterModalVisible] = useState(false);

    // State cho Modal Sửa Học Kỳ (ĐÃ XÓA SỬA NĂM)
    const [isEditingSemester, setIsEditingSemester] = useState(false);
    const [editingYear, setEditingYear] = useState(null);
    const [editingSemester, setEditingSemester] = useState(null);

    useEffect(() => {
        if (!years || years.length === 0) {
            fetchYearsAndSemesters();
        }
    }, [fetchYearsAndSemesters, years]);

    // Xử lý sau khi thêm/sửa thành công
    const handleAddSuccess = () => {
        fetchYearsAndSemesters(); // Tải lại dữ liệu context
        // Đóng Modal Thêm
        setYearModalVisible(false);
        setSemesterModalVisible(false);
        // Đóng Modal Sửa Học Kỳ
        setIsEditingSemester(false);
        setEditingYear(null);
        setEditingSemester(null);
    };

    const handleDeleteYear = (yearId) => {
        Alert.alert(
            'Xác nhận xóa',
            'Xóa năm học sẽ xóa TẤT CẢ học kỳ và lịch học con. Bạn có chắc?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        deleteYear(yearId).then(response => {
                            if (response.success) {
                                Alert.alert('Thành công', 'Đã xóa năm học.');
                            } else {
                                Alert.alert('Thất bại', response.message || 'Không thể xóa năm học.');
                            }
                        }).catch(() => {
                            Alert.alert('Lỗi', 'Không thể kết nối server.');
                        });
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const handleDeleteSemester = (semId) => {
        Alert.alert(
            'Xác nhận xóa',
            'Xóa học kỳ này cũng sẽ xóa TẤT CẢ lịch học liên quan.',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        deleteSemester(semId).then(response => {
                            if (response.success) {
                                Alert.alert('Thành công', 'Đã xóa học kỳ.');
                            } else {
                                Alert.alert('Thất bại', response.message || 'Không thể xóa học kỳ.');
                            }
                        }).catch(() => {
                            Alert.alert('Lỗi', 'Không thể kết nối server.');
                        });
                    },
                },
            ],
            { cancelable: true }
        );
    };

    // CHỈ SỬA HỌC KỲ, KHÔNG SỬA NĂM
    const handleEditSemester = (year, semester) => {
        console.log('Sửa học kỳ:', { year, semester });
        setEditingYear(year);
        setEditingSemester(semester);
        setIsEditingSemester(true);
    };

    const handleGoBack = () => {
        if (typeof setCurrentScreen === 'function') {
            setCurrentScreen('tkb');
        }
    };

    if (contextLoading && years.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    // --- COMPONENT CARD RIÊNG ---
    const YearCard = ({ item }) => (
        <View style={styles.card}>
            {/* Hàng Tiêu đề Năm Học - ĐÃ XÓA NÚT SỬA */}
            <View style={styles.yearHeaderRow}>
                <View style={styles.row}>
                    <CalendarIcon size={18} color="#4B5563" />
                    <Text style={[styles.name, item.year_id === selectedSemester?.year_id && styles.currentYear]}>
                        {item.name}
                    </Text>
                </View>
                <View style={styles.actions}>
                    {/* CHỈ CÒN NÚT XÓA, KHÔNG CÓ SỬA NĂM */}
                    <TouchableOpacity onPress={() => handleDeleteYear(item.year_id)} style={styles.deleteButton}>
                        <Trash2Icon size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Danh sách Học kỳ */}
            <View style={styles.semestersList}>
                {item.semesters && item.semesters.map((s) => (
                    <View key={s.sem_id} style={styles.semItemContainer}>
                        <Text
                            style={[
                                styles.semItem,
                                s.sem_id === selectedSemester?.sem_id && styles.currentSem
                            ]}
                        >
                            • {s.name}
                        </Text>
                        <View style={styles.actions}>
                            {/* VẪN GIỮ SỬA HỌC KỲ */}
                            <TouchableOpacity onPress={() => handleEditSemester(item, s)} style={styles.editButton}>
                                <Edit2Icon size={14} color="#10B981" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteSemester(s.sem_id)} style={styles.deleteButton}>
                                <Trash2Icon size={14} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.backButtonContainer}>
                <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                    <ArrowLeft size={20} color="#2563EB" />
                    <Text style={styles.backButtonText}>Quay lại TKB</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.title}>Quản lý năm học & học kỳ</Text>

            <View style={styles.actionSection}>
                <View style={styles.quickButtons}>
                    {/* Thao tác Thêm Năm */}
                    <TouchableOpacity
                        style={[styles.quickButton, styles.yearButton]}
                        onPress={() => setYearModalVisible(true)}
                    >
                        <Text style={styles.quickButtonText}>Thêm năm học</Text>
                    </TouchableOpacity>
                    {/* Thao tác Thêm Học Kỳ */}
                    <TouchableOpacity
                        style={[styles.quickButton, styles.semesterButton]}
                        onPress={() => setSemesterModalVisible(true)}
                    >
                        <Text style={styles.quickButtonText}>Thêm học kỳ</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* DANH SÁCH QUẢN LÝ NĂM/HỌC KỲ */}
            <FlatList
                data={years}
                keyExtractor={(item) => item.year_id?.toString()}
                renderItem={({ item }) => <YearCard item={item} />}
                ListEmptyComponent={() => (
                    <Text style={styles.emptyText}>Chưa có năm học nào. Vui lòng thêm năm học.</Text>
                )}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={false}
            />

            {/* 1. Modal Thêm Năm Học */}
            <YearModal
                visible={yearModalVisible}
                onClose={() => setYearModalVisible(false)}
                onSubmit={handleAddSuccess}
            />

            {/* 2. Modal Thêm Học Kỳ */}
            <SemesterModal
                visible={semesterModalVisible}
                onClose={() => setSemesterModalVisible(false)}
                onSubmit={handleAddSuccess}
            />

            {/* 3. MODAL SỬA HỌC KỲ (CHỈ CÒN SỬA HỌC KỲ) */}
            {editingSemester && editingYear && (
                <SemesterModal
                    visible={isEditingSemester}
                    onClose={() => {
                        setIsEditingSemester(false);
                        setEditingYear(null);
                        setEditingSemester(null);
                    }}
                    onSubmit={handleAddSuccess}
                    initialData={editingSemester}
                    parentYear={editingYear}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    backButtonContainer: {
        paddingTop: 10,
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    backButtonText: {
        color: '#2563EB',
        fontSize: 16,
        marginLeft: 4,
    },

    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
        paddingHorizontal: 16
    },

    actionSection: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    quickButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    quickButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    yearButton: {
        backgroundColor: '#10B981',
    },
    semesterButton: {
        backgroundColor: '#8B5CF6',
    },
    quickButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

    flatListContent: {
        paddingBottom: 100,
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    yearHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 12,
        marginBottom: 8
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    name: {
        marginLeft: 8,
        fontWeight: '700',
        color: '#111827',
        fontSize: 16
    },
    currentYear: {
        color: '#FF9800',
        fontWeight: 'bold'
    },
    semestersList: {
        paddingLeft: 10
    },
    semItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB'
    },
    semItem: {
        marginLeft: 8,
        color: '#4B5563',
        fontSize: 14,
        flex: 1
    },
    currentSem: {
        color: '#2563EB',
        fontWeight: '600'
    },
    actions: {
        flexDirection: 'row',
        gap: 8
    },
    editButton: {
        padding: 4
    },
    deleteButton: {
        padding: 4
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 16,
        marginTop: 50,
    }
});