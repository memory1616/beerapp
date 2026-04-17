/**
 * Beer POS Mobile - Orders Screen
 * Màn hình danh sách đơn hàng
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SalesAPI } from '../services/api';
import { formatVND, formatDate } from '../store';

// ==================== ORDER ITEM ====================

function OrderItem({ order, onPress }) {
  const statusColors = {
    completed: '#dcfce7',
    returned: '#fee2e2',
    pending: '#fef3c7',
  };

  return (
    <TouchableOpacity style={styles.orderCard} onPress={() => onPress(order)}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Đơn #{order.id}</Text>
          <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[order.status] || statusColors.pending }]}>
          <Text style={styles.statusText}>
            {order.status === 'returned' ? 'Đã trả' : 'Hoàn thành'}
          </Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.customerName}>
          {order.customer_name || 'Khách lẻ'}
        </Text>
        <Text style={styles.itemsCount}>
          {order.items_qty || 0} sản phẩm
        </Text>
      </View>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.orderTotal}>{formatVND(order.total)}</Text>
          <Text style={styles.orderProfit}>+{formatVND(order.profit)}</Text>
        </View>
        {order.deliver_kegs > 0 && (
          <View style={styles.kegInfo}>
            <Text style={styles.kegText}>
              +{order.deliver_kegs} vỏ
            </Text>
            {order.return_kegs > 0 && (
              <Text style={styles.returnText}>
                -{order.return_kegs} vỏ
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ==================== MAIN ORDERS SCREEN ====================

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Load orders
  const loadOrders = useCallback(async (pageNum = 1, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await SalesAPI.getAll({
        page: pageNum,
        limit: 20,
        status: filterStatus === 'all' ? undefined : filterStatus,
      });

      const newOrders = result.sales || [];

      if (reset) {
        setOrders(newOrders);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }

      setHasMore(pageNum < result.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.log('Error loading orders:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng');
    }

    setLoading(false);
    setLoadingMore(false);
  }, [filterStatus]);

  useEffect(() => {
    loadOrders(1, true);
  }, [loadOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders(1, true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadOrders(page + 1);
    }
  };

  const handleOrderPress = (order) => {
    Alert.alert(
      `Đơn hàng #${order.id}`,
      `${formatDate(order.date)}\n${order.customer_name || 'Khách lẻ'}\n\nTổng: ${formatVND(order.total)}\nLợi nhuận: ${formatVND(order.profit)}`,
      [{ text: 'Đóng' }]
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#1a365d" />
      </View>
    );
  };

  const statusFilters = [
    { key: 'all', label: 'Tất cả' },
    { key: 'completed', label: 'Hoàn thành' },
    { key: 'returned', label: 'Đã trả' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {statusFilters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filterStatus === f.key && styles.filterTabActive]}
            onPress={() => setFilterStatus(f.key)}
          >
            <Text style={[styles.filterTabText, filterStatus === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <OrderItem order={item} onPress={handleOrderPress} />
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
              {loading ? 'Đang tải...' : 'Chưa có đơn hàng nào'}
            </Text>
          </View>
        }
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a365d',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterTabActive: {
    backgroundColor: '#1a365d',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  // Order Card
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  orderInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  itemsCount: {
    fontSize: 12,
    color: '#888',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  orderProfit: {
    fontSize: 12,
    color: '#16a34a',
    marginTop: 2,
  },
  kegInfo: {
    alignItems: 'flex-end',
  },
  kegText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  returnText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 2,
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
});
