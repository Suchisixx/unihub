import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { MapPinIcon, Trash2Icon, EditIcon, PlusIcon } from 'lucide-react-native';

export default function CampusScreen() {
    const [campuses, setCampuses] = useState([
        { id: 1, name: 'Trụ sở A', address: '12 Nguyễn Văn Bảo, Gò Vấp' },
        { id: 2, name: 'Trụ sở B', address: '45 Lê Văn Việt, Thủ Đức' },
    ]);
    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');

    const handleAdd = () => {
        if (!newName || !newAddress) {
            return Alert.alert('Thiếu thông tin', 'Nhập đủ tên và địa chỉ cơ sở.');
        }
        setCampuses([...campuses, { id: Date.now(), name: newName, address: newAddress }]);
        setNewName('');
        setNewAddress('');
    };

    const handleDelete = (id) => {
        Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa cơ sở này?', [
            { text: 'Hủy' },
            { text: 'Xóa', style: 'destructive', onPress: () => setCampuses(campuses.filter(c => c.id !== id)) },
        ]);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Quản lý cơ sở</Text>

            <View style={styles.addBox}>
                <TextInput
                    placeholder="Tên cơ sở"
                    value={newName}
                    onChangeText={setNewName}
                    style={styles.input}
                />
                <TextInput
                    placeholder="Địa chỉ cơ sở"
                    value={newAddress}
                    onChangeText={setNewAddress}
                    style={styles.input}
                />
                <TouchableOpacity style={[styles.button, { backgroundColor: '#2196F3' }]} onPress={handleAdd}>
                    <PlusIcon size={16} color="#fff" />
                    <Text style={styles.buttonText}>Thêm cơ sở</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={campuses}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <MapPinIcon size={20} color="#2196F3" />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.address}>{item.address}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                <Trash2Icon size={18} color="red" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#222', marginBottom: 12 },
    addBox: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 16, elevation: 2 },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 10,
        marginBottom: 8,
        backgroundColor: '#fff',
    },
    button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8 },
    buttonText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
    card: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 1,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    name: { fontWeight: '600', color: '#222' },
    address: { fontSize: 12, color: '#666' },
});
