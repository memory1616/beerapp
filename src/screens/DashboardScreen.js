/**
 * Beer POS Mobile - Dashboard Screen
 * Màn hình tổng quan - doanh thu, đơn hàng, thống kê nhanh
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnalyticsAPI, KegsAPI, StockAPI } from '../services/api';
import { formatVND, formatDate } from '../store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==================== PERIOD SELECTOR ====================

function PeriodSelector({ selected, onSelect }) {
  const periods = [
    { key: 'today', label: 'Hôm nay' },
    { key: 'week', label: '7 ngày' },
    { key: 'month', label: 'Tháng này' },
  ];

  return (
    <View style={styles.periodSelector}>
      {periods.map((p) => (
        <TouchableOpacity
          key={p.key}
          style={[styles.periodBtn, selected === p.key && styles.periodBtnActive]}
          onPress={() => onSelect(p.key)}
        >
          <Text style={[styles.periodBtnText, selected === p.key && styles.periodBtnTextActive]}>
            {p.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ==================== STAT CARD ====================

function StatCard({ title, value, subtitle, color = '#1a365d', icon }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        {icon && <Text style={styles.statIcon}>{icon}</Text>}
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ==================== MINI CHART ====================

function MiniChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartEmpty}>Không có dữ liệu</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(d => d.revenue || 0));
  const chartHeight = 100;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartContainer}>
        {data.slice(0, 7).reverse().map((item, index) => {
          const barHeight = maxValue > 0 ? (item.revenue / maxValue) * chartHeight : 0;
          return (
            <View key={index} style={styles.chartBar}>
              <View style={[styles.chartBarFill, { height: barHeight }]} />
              <Text style={styles.chartBarLabel}>
                {item.day?.slice(-2) || ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ==================== TOP PRODUCT ITEM ====================

function TopProductItem({ product, index }) {
  const profitMargin = product.revenue > 0 
    ? ((product.profit / product.revenue) * 100).toFixed(1)
    : 0;

  return (
    <View style={styles.topProductItem}>
      <View style={styles.topProductRank}>
        <Text style={styles.topProductRankText}>{index + 1}</Text>
      </View>
      <View style={styles.topProductInfo}>
        <Text style={styles.topProductName}>{product.name}</Text>
        <Text style={styles.topProductQty}>{product.total_qty} đã bán</Text>
      </View>
      <View style={styles.topProductStats}>
        <Text style={styles.topProductRevenue}>{formatVND(product.revenue)}</Text>
        <Text style={styles.topProductProfit}>+{formatVND(product.profit)}</Text>
      </View>
    </View>
  );
}

// ==================== KEG STATUS CARD ====================

function KegStatusCard({ stats }) {
  if (!stats) {
    return (
      <View style={styles.kegCard}>
        <Text style={styles.kegCardTitle}>Trạng thái vỏ</Text>
        <ActivityIndicator size="small" color="#1a365d" />
      </View>
    );
  }

  return (
    <View style={styles.kegCard}>
      <Text style={styles.kegCardTitle}>Trạng thái vỏ</Text>
      <View style={styles.kegGrid}>
        <View style={styles.kegItem}>
          <Text style={styles.kegValue}>{stats.inventory}</Text>
          <Text style={styles.kegLabel}>Trong kho</Text>
        </View>
        <View style={styles.kegItem}>
          <Text style={[styles.kegValue, { color: '#f59e0b' }]}>{stats.emptyCollected}</Text>
          <Text style={styles.kegLabel}>Vỏ rỗng</Text>
        </View>
        <View style={styles.kegItem}>
          <Text style={[styles.kegValue, { color: '#16a34a' }]}>{stats.customerHolding}</Text>
          <Text style={styles.kegLabel}>Khách giữ</Text>
        </View>
      </View>
    </View>
  );
}

// ==================== STOCK ALERT CARD ====================

function StockAlertCard({ alerts }) {
  if (!alerts || alerts.count === 0) {
    return (
      <View style={styles.alertCard}>
        <Text style={styles.alertCardTitle}>Cảnh báo tồn kho</Text>
        <View style={styles.alertOk}>
          <Text style={styles.alertOkText}>✓ Tất cả sản phẩm đủ hàng</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <Text style={styles.alertCardTitle}>Cảnh báo tồn kho</Text>
        <View style={styles.alertBadge}>
          <Text style={styles.alertBadgeText}>{alerts.count}</Text>
        </View>
      </View>
      {alerts.products?.slice(0, 3).map((p) => (
        <View key={p.id} style={styles.alertItem}>
          <Text style={styles.alertProductName}>{p.name}</Text>
          <Text style={styles.alertProductStock}>Còn {p.stock}</Text>
        </View>
      ))}
    </View>
  );
}

// ==================== MAIN DASHBOARD SCREEN ====================

export default function DashboardScreen({ navigation }) {
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [kegStats, setKegStats] = useState(null);
  const [stockAlerts, setStockAlerts] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      // Calculate date range based on period
      const today = new Date();
      let startDate, endDate;

      if (period === 'today') {
        startDate = endDate = today.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      } else {
        // month
        startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        endDate = today.toISOString().split('T')[0];
      }

      // Load all data in parallel
      const [report, kegs, alerts] = await Promise.all([
        AnalyticsAPI.getReport({ startDate, endDate, mode: 'quick', period }),
        KegsAPI.getState().catch(() => null),
        StockAPI.getAlerts(10).catch(() => null),
      ]);

      setReportData(report);
      setKegStats(kegs);
      setStockAlerts(alerts);
    } catch (error) {
      console.log('Error loading dashboard:', error);
    }
    setLoading(false);
  }, [period]);

  useEffect(() => {
    setLoading(true);
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Calculate summary stats
  const summary = reportData
    ? {
        revenue: reportData.totalRevenue || 0,
        profit: reportData.totalProfit || 0,
        orders: reportData.totalOrders || 0,
        expense: reportData.totalExpense || 0,
      }
    : { revenue: 0, profit: 0, orders: 0, expense: 0 };

  // Daily chart data
  const chartData = reportData?.daily || [];

  // Top products
  const topProducts = (reportData?.profitByProduct || []).slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a365d" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerDate}>{formatDate(new Date().toISOString())}</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <PeriodSelector selected={period} onSelect={setPeriod} />

        {/* Summary Stats */}
        <View style={styles.summaryGrid}>
          <StatCard
            title="Doanh thu"
            value={formatVND(summary.revenue)}
            subtitle={`${summary.orders} đơn hàng`}
            color="#1a365d"
            icon="💰"
          />
          <StatCard
            title="Lợi nhuận"
            value={formatVND(summary.profit)}
            subtitle={`${summary.expense > 0 ? `-${formatVND(summary.expense)} chi phí` : 'Không có chi phí'}`}
            color="#16a34a"
            icon="📈"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('POS')}
          >
            <Text style={styles.quickActionIcon}>🛒</Text>
            <Text style={styles.quickActionText}>Bán hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate('Customers')}
          >
            <Text style={styles.quickActionIcon}>👥</Text>
            <Text style={styles.quickActionText}>Khách hàng</Text>
          </TouchableOpacity>
        </View>

        {/* Chart */}
        <MiniChart data={chartData} title="Doanh thu theo ngày" />

        {/* Keg Status */}
        <KegStatusCard stats={kegStats} />

        {/* Stock Alerts */}
        <StockAlertCard alerts={stockAlerts} />

        {/* Top Products */}
        {topProducts.length > 0 && (
          <View style={styles.topProductsCard}>
            <Text style={styles.topProductsTitle}>Sản phẩm bán chạy</Text>
            {topProducts.map((product, index) => (
              <TopProductItem key={product.id} product={product} index={index} />
            ))}
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
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
  headerDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  periodBtnActive: {
    backgroundColor: '#1a365d',
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodBtnTextActive: {
    color: '#fff',
  },

  // Summary Grid
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  // Stat Card
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statTitle: {
    fontSize: 13,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#888',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Chart
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarFill: {
    width: 24,
    backgroundColor: '#1a365d',
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  chartEmpty: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    paddingVertical: 20,
  },

  // Keg Card
  kegCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  kegCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  kegGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  kegItem: {
    alignItems: 'center',
  },
  kegValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  kegLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },

  // Alert Card
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  alertBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  alertOk: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 8,
  },
  alertOkText: {
    color: '#16a34a',
    fontWeight: '600',
    textAlign: 'center',
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertProductName: {
    fontSize: 14,
    color: '#333',
  },
  alertProductStock: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },

  // Top Products
  topProductsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topProductsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topProductRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topProductRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  topProductQty: {
    fontSize: 12,
    color: '#888',
  },
  topProductStats: {
    alignItems: 'flex-end',
  },
  topProductRevenue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  topProductProfit: {
    fontSize: 11,
    color: '#16a34a',
  },
});
