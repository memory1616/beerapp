/**
 * Beer POS Mobile - State Management Store
 * Sử dụng React Context + useReducer cho state management đơn giản
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductsAPI, CustomersAPI } from '../services/api';

// ==================== INITIAL STATE ====================

const initialState = {
  // Server
  serverUrl: 'http://localhost:3000',
  isConnected: false,
  
  // Products
  products: [],
  productsLoading: false,
  productsError: null,
  
  // Cart (POS)
  cart: [], // { product, quantity, price }
  selectedCustomer: null,
  
  // Customers
  customers: [],
  customersLoading: false,
  customersError: null,
  
  // Dashboard
  dashboardData: null,
  dashboardLoading: false,
  
  // Keg Stats
  kegStats: null,
  
  // UI State
  isOnline: true,
  lastSync: null,
};

// ==================== ACTIONS ====================

const ACTIONS = {
  // Server
  SET_SERVER_URL: 'SET_SERVER_URL',
  SET_CONNECTED: 'SET_CONNECTED',
  
  // Products
  SET_PRODUCTS: 'SET_PRODUCTS',
  SET_PRODUCTS_LOADING: 'SET_PRODUCTS_LOADING',
  SET_PRODUCTS_ERROR: 'SET_PRODUCTS_ERROR',
  
  // Cart
  ADD_TO_CART: 'ADD_TO_CART',
  UPDATE_CART_ITEM: 'UPDATE_CART_ITEM',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  CLEAR_CART: 'CLEAR_CART',
  SET_CUSTOMER: 'SET_CUSTOMER',
  
  // Customers
  SET_CUSTOMERS: 'SET_CUSTOMERS',
  SET_CUSTOMERS_LOADING: 'SET_CUSTOMERS_LOADING',
  SET_CUSTOMERS_ERROR: 'SET_CUSTOMERS_ERROR',
  
  // Dashboard
  SET_DASHBOARD_DATA: 'SET_DASHBOARD_DATA',
  SET_DASHBOARD_LOADING: 'SET_DASHBOARD_LOADING',
  
  // Kegs
  SET_KEG_STATS: 'SET_KEG_STATS',
  
  // UI
  SET_ONLINE: 'SET_ONLINE',
  SET_LAST_SYNC: 'SET_LAST_SYNC',
};

// ==================== REDUCER ====================

function reducer(state, action) {
  switch (action.type) {
    // Server
    case ACTIONS.SET_SERVER_URL:
      return { ...state, serverUrl: action.payload };
    case ACTIONS.SET_CONNECTED:
      return { ...state, isConnected: action.payload };
    
    // Products
    case ACTIONS.SET_PRODUCTS:
      return { ...state, products: action.payload, productsLoading: false, productsError: null };
    case ACTIONS.SET_PRODUCTS_LOADING:
      return { ...state, productsLoading: action.payload };
    case ACTIONS.SET_PRODUCTS_ERROR:
      return { ...state, productsError: action.payload, productsLoading: false };
    
    // Cart
    case ACTIONS.ADD_TO_CART: {
      const { product, price } = action.payload;
      const existingIndex = state.cart.findIndex(
        item => item.product.id === product.id
      );
      
      if (existingIndex >= 0) {
        // Tăng số lượng nếu đã có
        const newCart = [...state.cart];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1,
        };
        return { ...state, cart: newCart };
      }
      
      // Thêm mới
      return {
        ...state,
        cart: [...state.cart, { product, quantity: 1, price }],
      };
    }
    
    case ACTIONS.UPDATE_CART_ITEM: {
      const { productId, quantity, price } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter(item => item.product.id !== productId),
        };
      }
      return {
        ...state,
        cart: state.cart.map(item =>
          item.product.id === productId
            ? { ...item, quantity, price: price ?? item.price }
            : item
        ),
      };
    }
    
    case ACTIONS.REMOVE_FROM_CART:
      return {
        ...state,
        cart: state.cart.filter(item => item.product.id !== action.payload),
      };
    
    case ACTIONS.CLEAR_CART:
      return { ...state, cart: [], selectedCustomer: null };
    
    case ACTIONS.SET_CUSTOMER:
      return { ...state, selectedCustomer: action.payload };
    
    // Customers
    case ACTIONS.SET_CUSTOMERS:
      return { ...state, customers: action.payload, customersLoading: false, customersError: null };
    case ACTIONS.SET_CUSTOMERS_LOADING:
      return { ...state, customersLoading: action.payload };
    case ACTIONS.SET_CUSTOMERS_ERROR:
      return { ...state, customersError: action.payload, customersLoading: false };
    
    // Dashboard
    case ACTIONS.SET_DASHBOARD_DATA:
      return { ...state, dashboardData: action.payload, dashboardLoading: false };
    case ACTIONS.SET_DASHBOARD_LOADING:
      return { ...state, dashboardLoading: action.payload };
    
    // Kegs
    case ACTIONS.SET_KEG_STATS:
      return { ...state, kegStats: action.payload };
    
    // UI
    case ACTIONS.SET_ONLINE:
      return { ...state, isOnline: action.payload };
    case ACTIONS.SET_LAST_SYNC:
      return { ...state, lastSync: action.payload };
    
    default:
      return state;
  }
}

// ==================== CONTEXT ====================

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Load saved settings on mount
  useEffect(() => {
    loadSavedSettings();
  }, []);
  
  async function loadSavedSettings() {
    try {
      const savedUrl = await AsyncStorage.getItem('serverBaseUrl');
      if (savedUrl) {
        dispatch({ type: ACTIONS.SET_SERVER_URL, payload: savedUrl });
      }
    } catch (error) {
      console.log('[Store] Error loading settings:', error);
    }
  }
  
  // Actions
  const actions = {
    setServerUrl: async (url) => {
      await AsyncStorage.setItem('serverBaseUrl', url);
      dispatch({ type: ACTIONS.SET_SERVER_URL, payload: url });
    },
    
    // Products
    loadProducts: async () => {
      dispatch({ type: ACTIONS.SET_PRODUCTS_LOADING, payload: true });
      try {
        const products = await ProductsAPI.getAll();
        dispatch({ type: ACTIONS.SET_PRODUCTS, payload: products });
      } catch (error) {
        dispatch({ type: ACTIONS.SET_PRODUCTS_ERROR, payload: error.message });
      }
    },
    
    // Cart
    addToCart: (product, price = null) => {
      const effectivePrice = price ?? product.sell_price ?? 0;
      dispatch({
        type: ACTIONS.ADD_TO_CART,
        payload: { product, price: effectivePrice },
      });
    },
    
    updateCartItem: (productId, quantity, price = null) => {
      dispatch({
        type: ACTIONS.UPDATE_CART_ITEM,
        payload: { productId, quantity, price },
      });
    },
    
    removeFromCart: (productId) => {
      dispatch({ type: ACTIONS.REMOVE_FROM_CART, payload: productId });
    },
    
    clearCart: () => {
      dispatch({ type: ACTIONS.CLEAR_CART });
    },
    
    setCustomer: (customer) => {
      dispatch({ type: ACTIONS.SET_CUSTOMER, payload: customer });
    },
    
    // Customers
    loadCustomers: async () => {
      dispatch({ type: ACTIONS.SET_CUSTOMERS_LOADING, payload: true });
      try {
        const result = await CustomersAPI.search();
        dispatch({ type: ACTIONS.SET_CUSTOMERS, payload: result.customers || [] });
      } catch (error) {
        dispatch({ type: ACTIONS.SET_CUSTOMERS_ERROR, payload: error.message });
      }
    },
    
    // Calculate cart total
    getCartTotal: () => {
      return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    },
    
    getCartQuantity: () => {
      return state.cart.reduce((sum, item) => sum + item.quantity, 0);
    },
  };
  
  return (
    <StoreContext.Provider value={{ state, actions }}>
      {children}
    </StoreContext.Provider>
  );
}

// ==================== HOOK ====================

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

// ==================== UTILITIES ====================

export function formatVND(amount) {
  if (amount === null || amount === undefined) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
