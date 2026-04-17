/**
 * Beer POS Mobile - POS Screen
 * Màn hình bán hàng chính - tối ưu cho thao tác nhanh
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore, formatVND } from '../store';
import { ProductsAPI, SalesAPI, CustomersAPI } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const PRODUCT_ITEM_WIDTH = (SCREEN_WIDTH - 40) / GRID_COLUMNS;

// ==================== PRODUCT GRID ITEM ====================

function ProductGridItem({ product, onPress, isInCart }) {
  return (
    <TouchableOpacity
      style={[styles.productItem, isInCart && styles.productItemInCart]}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.productPrice}>
        {formatVND(product.sell_price)}
      </Text>
      <Text style={styles.productStock}>
        Còn: {product.stock}
      </Text>
    </TouchableOpacity>
  );
}

// ==================== CART ITEM ====================

function CartItem({ item, onUpdate, onRemove }) {
  return (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.product.name}</Text>
        <Text style={styles.cartItemPrice}>{formatVND(item.price)}</Text>
      </View>
      <View style={styles.cartItemActions}>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => onUpdate(item.product.id, item.quantity - 1)}
        >
          <Text style={styles.cartBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.cartItemQty}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => onUpdate(item.product.id, item.quantity + 1)}
        >
          <Text style={styles.cartBtnText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cartBtn, styles.cartBtnDelete]}
          onPress={() => onRemove(item.product.id)}
        >
          <Text style={styles.cartBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cartItemTotal}>
        {formatVND(item.price * item.quantity)}
      </Text>
    </View>
  );
}

// ==================== CUSTOMER SELECTOR ====================

function CustomerSelector({ visible, onClose, onSelect, selectedCustomer }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await CustomersAPI.search(searchQuery);
      setCustomers(result.customers || []);
    } catch (error) {
      console.log('Error loading customers:', error);
    }
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    if (visible) {
      loadCustomers();
    }
  }, [visible, loadCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const handleSelect = (customer) => {
    onSelect(customer);
    setSearchQuery('');
    onClose();
  };

  const handleClear = () => {
    onSelect(null);
    setSearchQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn Khách Hàng</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên, số điện thoại..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />

          {selectedCustomer && (
            <TouchableOpacity style={styles.selectedCustomerBanner} onPress={handleClear}>
              <Text style={styles.selectedCustomerText}>
                ✓ {selectedCustomer.name} - {formatVND(selectedCustomer.keg_balance || 0)} vỏ
              </Text>
              <Text style={styles.clearText}>Xóa</Text>
            </TouchableOpacity>
          )}

          <FlatList
            data={filteredCustomers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerItem}
                onPress={() => handleSelect(item)}
              >
                <View>
                  <Text style={styles.customerName}>{item.name}</Text>
                  <Text style={styles.customerPhone}>{item.phone || 'Không có SDT'}</Text>
                </View>
                <View style={styles.customerBalance}>
                  <Text style={styles.customerBalanceText}>
                    {item.keg_balance || 0} vỏ
                  </Text>
                  <Text style={styles.customerDebt}>
                    {item.debt > 0 ? `Nợ: ${formatVND(item.debt)}` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {loading ? 'Đang tải...' : 'Không tìm thấy khách hàng'}
              </Text>
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={loadCustomers} />
            }
          />
        </View>
      </View>
    </Modal>
  );
}

// ==================== NUMERIC KEYPAD ====================

function NumericKeypad({ value, onChange, onDone }) {
  const handlePress = (key) => {
    if (key === 'C') {
      onChange('');
    } else if (key === '⌫') {
      onChange(value.slice(0, -1));
    } else if (key === 'OK') {
      onDone();
    } else {
      onChange(value + key);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫', 'OK'];

  return (
    <View style={styles.keypad}>
      {keys.map((key) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.keypadBtn,
            key === 'OK' && styles.keypadBtnOk,
            (key === 'C' || key === '⌫') && styles.keypadBtnAction,
          ]}
          onPress={() => handlePress(key)}
        >
          <Text style={[
            styles.keypadBtnText,
            key === 'OK' && styles.keypadBtnOkText,
          ]}>
            {key}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ==================== MAIN POS SCREEN ====================

export default function POSScreen({ navigation }) {
  const { state, actions } = useStore();
  const { products, cart, selectedCustomer, isConnected } = state;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadTarget, setKeypadTarget] = useState(null); // { productId, type }
  const [keypadValue, setKeypadValue] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, keg, pet, box
  const [submitting, setSubmitting] = useState(false);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      await actions.loadProducts();
    } catch (error) {
      console.log('Error loading products:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  // Filter products by type
  const filteredProducts = useMemo(() => {
    if (filterType === 'all') return products;
    return products.filter(p => p.type === filterType);
  }, [products, filterType]);

  // Check if product is in cart
  const cartProductIds = useMemo(() => {
    return new Set(cart.map(item => item.product.id));
  }, [cart]);

  // Handle product tap
  const handleProductTap = (product) => {
    if (product.stock <= 0) {
      Alert.alert('Hết hàng', `${product.name} đã hết hàng`);
      return;
    }
    actions.addToCart(product);
  };

  // Handle long press to edit quantity/price
  const handleProductLongPress = (product) => {
    setKeypadTarget({ productId: product.id, type: 'quantity' });
    setKeypadValue('');
    setShowKeypad(true);
  };

  // Handle keypad done
  const handleKeypadDone = () => {
    if (!keypadTarget || !keypadValue) {
      setShowKeypad(false);
      return;
    }

    const qty = parseInt(keypadValue) || 1;
    actions.updateCartItem(keypadTarget.productId, qty);
    setShowKeypad(false);
    setKeypadTarget(null);
    setKeypadValue('');
  };

  // Handle cart item update
  const handleCartUpdate = (productId, quantity) => {
    if (quantity <= 0) {
      actions.removeFromCart(productId);
    } else {
      actions.updateCartItem(productId, quantity);
    }
  };

  // Handle cart item remove
  const handleCartRemove = (productId) => {
    actions.removeFromCart(productId);
  };

  // Handle customer select
  const handleCustomerSelect = async (customer) => {
    actions.setCustomer(customer);

    // Load customer prices if customer selected
    if (customer) {
      try {
        const prices = await ProductsAPI.getPrices(customer.id);
        // Apply customer-specific prices to cart
        if (prices && prices.length > 0) {
          // Prices will be applied when creating sale via API
        }
      } catch (error) {
        console.log('Error loading customer prices:', error);
      }
    }
  };

  // Handle submit order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm vào giỏ hàng');
      return;
    }

    Alert.alert(
      'Xác nhận đơn hàng',
      `Tổng tiền: ${formatVND(actions.getCartTotal())}\nKhách hàng: ${selectedCustomer?.name || 'Khách lẻ'}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setSubmitting(true);
            try {
              const items = cart.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.price,
              }));

              const result = await SalesAPI.create({
                customerId: selectedCustomer?.id || null,
                items,
              });

              if (result.success) {
                Alert.alert(
                  'Thành công',
                  `Đơn hàng #${result.id}\nTổng: ${formatVND(result.total)}`,
                  [{ text: 'OK', onPress: () => actions.clearCart() }]
                );
              }
            } catch (error) {
              Alert.alert('Lỗi', error.response?.data?.error || 'Tạo đơn hàng thất bại');
            }
            setSubmitting(false);
          },
        },
      ]
    );
  };

  // Calculate totals
  const cartTotal = actions.getCartTotal();
  const cartQuantity = actions.getCartQuantity();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>POS</Text>
          <View style={[styles.connectionDot, isConnected ? styles.connected : styles.disconnected]} />
        </View>
        <TouchableOpacity
          style={styles.customerBtn}
          onPress={() => setShowCustomerModal(true)}
        >
          <Text style={styles.customerBtnText}>
            {selectedCustomer ? selectedCustomer.name : 'Chọn KH'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'keg', 'pet', 'box'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, filterType === type && styles.filterTabActive]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[styles.filterTabText, filterType === type && styles.filterTabTextActive]}>
              {type === 'all' ? 'Tất cả' : type === 'keg' ? 'Keg' : type === 'pet' ? 'Pet' : 'Box'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={GRID_COLUMNS}
        contentContainerStyle={styles.productGrid}
        columnWrapperStyle={styles.productRow}
        renderItem={({ item }) => (
          <ProductGridItem
            product={item}
            onPress={handleProductTap}
            isInCart={cartProductIds.has(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyProducts}>
            <Text style={styles.emptyText}>
              {loading ? 'Đang tải sản phẩm...' : 'Không có sản phẩm'}
            </Text>
          </View>
        }
      />

      {/* Cart Summary */}
      <View style={styles.cartSummary}>
        <View style={styles.cartInfo}>
          <Text style={styles.cartCount}>
            {cartQuantity} sản phẩm
          </Text>
          <Text style={styles.cartTotal}>
            {formatVND(cartTotal)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.clearBtn, cart.length === 0 && styles.clearBtnDisabled]}
          onPress={actions.clearCart}
          disabled={cart.length === 0}
        >
          <Text style={styles.clearBtnText}>Xóa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmitOrder}
          disabled={cart.length === 0 || submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'Đang xử lý...' : 'Thanh toán'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cart Details Modal */}
      <Modal
        visible={cart.length > 0 && showKeypad === false}
        animationType="slide"
        transparent
        onRequestClose={() => {}}
      >
        <TouchableOpacity
          style={styles.cartOverlay}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={styles.cartDetails}>
            <Text style={styles.cartDetailsTitle}>Giỏ hàng</Text>
            <FlatList
              data={cart}
              keyExtractor={(item) => item.product.id.toString()}
              renderItem={({ item }) => (
                <CartItem
                  item={item}
                  onUpdate={handleCartUpdate}
                  onRemove={handleCartRemove}
                />
              )}
              style={styles.cartList}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Keypad Modal */}
      <Modal visible={showKeypad} animationType="slide" transparent>
        <TouchableOpacity
          style={styles.keypadOverlay}
          activeOpacity={1}
          onPress={() => setShowKeypad(false)}
        >
          <View style={styles.keypadContainer}>
            <Text style={styles.keypadTitle}>
              Nhập số lượng
            </Text>
            <Text style={styles.keypadValue}>
              {keypadValue || '0'}
            </Text>
            <NumericKeypad
              value={keypadValue}
              onChange={setKeypadValue}
              onDone={handleKeypadDone}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Customer Selector Modal */}
      <CustomerSelector
        visible={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelect={handleCustomerSelect}
        selectedCustomer={selectedCustomer}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  connected: {
    backgroundColor: '#4ade80',
  },
  disconnected: {
    backgroundColor: '#f87171',
  },
  customerBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  customerBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
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

  // Product Grid
  productGrid: {
    padding: 8,
    paddingBottom: 100,
  },
  productRow: {
    justifyContent: 'flex-start',
  },
  productItem: {
    width: PRODUCT_ITEM_WIDTH,
    margin: 4,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productItemInCart: {
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 11,
    color: '#888',
  },
  emptyProducts: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },

  // Cart Summary
  cartSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cartInfo: {
    flex: 1,
  },
  cartCount: {
    fontSize: 12,
    color: '#888',
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  clearBtnDisabled: {
    opacity: 0.5,
  },
  clearBtnText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  submitBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4ade80',
    borderRadius: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Cart Item
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#888',
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  cartBtnDelete: {
    backgroundColor: '#fee2e2',
    marginLeft: 8,
  },
  cartBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cartItemQty: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItemTotal: {
    minWidth: 80,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
  },

  // Cart Details Modal
  cartOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cartDetails: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  cartDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  cartList: {
    maxHeight: 300,
  },

  // Customer Selector Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalClose: {
    fontSize: 24,
    color: '#888',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    fontSize: 16,
  },
  selectedCustomerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
    marginTop: 0,
    padding: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 10,
  },
  selectedCustomerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  clearText: {
    color: '#dc2626',
    fontSize: 14,
  },
  customerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  customerPhone: {
    fontSize: 13,
    color: '#888',
  },
  customerBalance: {
    alignItems: 'flex-end',
  },
  customerBalanceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  customerDebt: {
    fontSize: 12,
    color: '#dc2626',
  },

  // Numeric Keypad
  keypadOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  keypadContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  keypadTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  keypadValue: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a365d',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  keypadBtn: {
    width: '30%',
    margin: '1.5%',
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  keypadBtnOk: {
    backgroundColor: '#4ade80',
  },
  keypadBtnAction: {
    backgroundColor: '#fee2e2',
  },
  keypadBtnText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  keypadBtnOkText: {
    color: '#fff',
  },
});
