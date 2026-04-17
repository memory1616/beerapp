/**
 * Beer POS Mobile - Customer Screen
 * Màn hình quản lý khách hàng - tìm kiếm nhanh, xem thông tin
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomersAPI, SalesAPI } from '../services/api';
import { formatVND, formatDate } from '../store';

// ==================== CUSTOMER CARD ====================

function CustomerCard({ customer, onPress, onCall }) {
  return (
    <TouchableOpacity style={styles.customerCard} onPress={() => onPress(customer)}>
      <View style={styles.customerInfo}>
        <Text style={styles.customerName}>{customer.name}</Text>
        <Text style={styles.customerPhone}>{customer.phone || 'Không có SDT'}</Text>
        {customer.address && (
          <Text style={styles.customerAddress} numberOfLines={1}>
            {customer.address}
          </Text>
        )}
      </View>
      <View style={styles.customerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{customer.keg_balance || 0}</Text>
          <Text style={styles.statLabel}>Vỏ</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, customer.debt > 0 && styles.debtValue]}>
            {formatVND(customer.debt || 0)}
          </Text>
          <Text style={styles.statLabel}>Nợ</Text>
        </View>
      </View>
      {customer.phone && (
        <TouchableOpacity style={styles.callBtn} onPress={() => onCall(customer)}>
          <Text style={styles.callBtnText}>Gọi</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ==================== CUSTOMER DETAIL MODAL ====================

function CustomerDetailModal({ visible, customer, onClose, onCreateOrder }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadCustomerData = useCallback(async () => {
    if (!customer) return;
    
    setLoading(true);
    try {
      const [statsData, salesData] = await Promise.all([
        CustomersAPI.getStats(customer.id),
        SalesAPI.getAll({ page: 1, limit: 10 }),
      ]);
      
      // Filter sales for this customer
      const customerSales = (salesData.sales || []).filter(
        s => s.customer_id === customer.id
      );
      
      setStats(statsData);
      setRecentSales(customerSales);
    } catch (error) {
      console.log('Error loading customer data:', error);
    }
    setLoading(false);
  }, [customer]);

  useEffect(() => {
    if (visible && customer) {
      loadCustomerData();
    }
  }, [visible, customer, loadCustomerData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCustomerData();
    setRefreshing(false);
  };

  if (!customer) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.backBtn}>← Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Chi tiết khách hàng</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.modalContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Customer Info Card */}
          <View style={styles.detailCard}>
            <Text style={styles.detailName}>{customer.name}</Text>
            <Text style={styles.detailPhone}>{customer.phone || 'Không có SDT'}</Text>
            {customer.address && (
              <Text style={styles.detailAddress}>{customer.address}</Text>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onCreateOrder(customer)}
            >
              <Text style={styles.actionBtnText}>+ Tạo đơn</Text>
            </TouchableOpacity>
            {customer.phone && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]}>
                <Text style={styles.actionBtnTextSecondary}>📞 Gọi điện</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Stats */}
          {loading ? (
            <ActivityIndicator size="large" color="#1a365d" style={{ marginVertical: 20 }} />
          ) : (
            <>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statCardValue}>
                    {formatVND(stats?.kegBalance || 0)}
                  </Text>
                  <Text style={styles.statCardLabel}>Vỏ đang giữ</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statCardValue}>
                    {formatVND(stats?.totalRevenue || 0)}
                  </Text>
                  <Text style={styles.statCardLabel}>Tổng mua</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={[styles.statCardValue, { color: '#16a34a' }]}>
                    {formatVND(stats?.monthlyRevenue || 0)}
                  </Text>
                  <Text style={styles.statCardLabel}>Tháng này</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statCardValue}>
                    {stats?.monthlyKegs || 0}
                  </Text>
                  <Text style={styles.statCardLabel}>Bình/tháng</Text>
                </View>
              </View>

              {/* Last Order */}
              {stats?.lastSaleDate && (
                <View style={styles.lastOrderCard}>
                  <Text style={styles.lastOrderLabel}>Lần mua gần nhất</Text>
                  <Text style={styles.lastOrderValue}>
                    {formatDate(stats.lastSaleDate)}
                    {stats.lastSaleDaysAgo !== null && (
                      <Text style={styles.lastOrderDays}>
                        {' '}({stats.lastSaleDaysAgo} ngày trước)
                      </Text>
                    )}
                  </Text>
                </View>
              )}

              {/* Recent Orders */}
              <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
              {recentSales.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
              ) : (
                recentSales.slice(0, 5).map((sale) => (
                  <View key={sale.id} style={styles.saleItem}>
                    <View>
                      <Text style={styles.saleDate}>{formatDate(sale.date)}</Text>
                      <Text style={styles.saleItems}>
                        {sale.items_qty || 0} sản phẩm
                      </Text>
                    </View>
                    <View style={styles.saleAmount}>
                      <Text style={styles.saleTotal}>{formatVND(sale.total)}</Text>
                      {sale.deliver_kegs > 0 && (
                        <Text style={styles.saleKegs}>
                          +{sale.deliver_kegs} vỏ
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ==================== ADD CUSTOMER MODAL ====================

function AddCustomerModal({ visible, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deposit, setDeposit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên khách hàng');
      return;
    }

    setLoading(true);
    try {
      await CustomersAPI.create({
        name: name.trim(),
        phone: phone.trim() || null,
        deposit: parseFloat(deposit) || 0,
      });
      
      Alert.alert('Thành công', 'Đã thêm khách hàng mới');
      setName('');
      setPhone('');
      setAddress('');
      setDeposit('');
      onSuccess();
      onClose();
    } catch (error) {
      Alert.alert('Lỗi', error.response?.data?.error || 'Không thể tạo khách hàng');
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.backBtn}>Hủy</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Thêm khách hàng</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.formContent}>
          <Text style={styles.formLabel}>Tên khách hàng *</Text>
          <TextInput
            style={styles.formInput}
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên"
          />

          <Text style={styles.formLabel}>Số điện thoại</Text>
          <TextInput
            style={styles.formInput}
            value={phone}
            onChangeText={setPhone}
            placeholder="Nhập số điện thoại"
            keyboardType="phone-pad"
          />

          <Text style={styles.formLabel}>Địa chỉ</Text>
          <TextInput
            style={[styles.formInput, styles.formInputMultiline]}
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.formLabel}>Tiền đặt cọc (VNĐ)</Text>
          <TextInput
            style={styles.formInput}
            value={deposit}
            onChangeText={setDeposit}
            placeholder="0"
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.submitFormBtn, loading && styles.submitFormBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitFormBtnText}>
              {loading ? 'Đang xử lý...' : 'Thêm khách hàng'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ==================== MAIN CUSTOMER SCREEN ====================

export default function CustomerScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Load customers
  const loadCustomers = useCallback(async (pageNum = 1, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await CustomersAPI.getAll({
        page: pageNum,
        limit: 20,
        fields: 'id,name,phone,address,keg_balance,debt,last_order_date',
      });

      const newCustomers = result.customers || [];
      
      if (reset) {
        setCustomers(newCustomers);
      } else {
        setCustomers(prev => [...prev, ...newCustomers]);
      }
      
      setHasMore(pageNum < result.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.log('Error loading customers:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách khách hàng');
    }

    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    loadCustomers(1, true);
  }, [loadCustomers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCustomers(1, true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadCustomers(page + 1);
    }
  };

  // Search with debounce
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    
    const query = searchQuery.toLowerCase().trim();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(query) ||
      c.phone?.includes(query)
    );
  }, [customers, searchQuery]);

  // Handle customer press
  const handleCustomerPress = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  // Handle call
  const handleCall = (customer) => {
    if (customer.phone) {
      Alert.alert(
        customer.name,
        `Số điện thoại: ${customer.phone}`,
        [{ text: 'OK' }]
      );
    }
  };

  // Handle create order
  const handleCreateOrder = (customer) => {
    setShowDetailModal(false);
    navigation.navigate('POS', { customer });
  };

  // Handle add success
  const handleAddSuccess = () => {
    loadCustomers(1, true);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#1a365d" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khách hàng</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Tìm tên, số điện thoại..."
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearch}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onPress={handleCustomerPress}
            onCall={handleCall}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Đang tải...' : 'Không tìm thấy khách hàng'}
            </Text>
          </View>
        }
      />

      {/* Modals */}
      <CustomerDetailModal
        visible={showDetailModal}
        customer={selectedCustomer}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedCustomer(null);
        }}
        onCreateOrder={handleCreateOrder}
      />

      <AddCustomerModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
    </SafeAreaView>
  );
}

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a365d',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearSearch: {
    padding: 8,
  },
  clearSearchText: {
    fontSize: 16,
    color: '#888',
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Customer Card
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
  },
  customerAddress: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  customerStats: {
    flexDirection: 'row',
    marginRight: 12,
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  debtValue: {
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
  },
  callBtn: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callBtnText: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 13,
  },

  // Empty
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },

  // Modal Container
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a365d',
  },
  backBtn: {
    fontSize: 16,
    color: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Detail Card
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  detailAddress: {
    fontSize: 14,
    color: '#888',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#4ade80',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  actionBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginRight: 0,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionBtnTextSecondary: {
    fontSize: 16,
    color: '#333',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#888',
  },

  // Last Order
  lastOrderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  lastOrderLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  lastOrderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  lastOrderDays: {
    color: '#888',
    fontWeight: 'normal',
  },

  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },

  // Sale Item
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  saleDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  saleItems: {
    fontSize: 12,
    color: '#888',
  },
  saleAmount: {
    alignItems: 'flex-end',
  },
  saleTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  saleKegs: {
    fontSize: 12,
    color: '#16a34a',
  },

  // Form
  formContent: {
    padding: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  formInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitFormBtn: {
    backgroundColor: '#1a365d',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitFormBtnDisabled: {
    opacity: 0.6,
  },
  submitFormBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
