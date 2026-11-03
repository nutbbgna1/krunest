// จัดการตะกร้าสินค้า: เพิ่ม / ปรับจำนวน / ลบ / ล้างตะกร้า
import { useState } from 'react';
import { SoftwareProgram } from '../data/programs';
import { PROGRAM_META } from '../data/programMeta';
import { CartItem } from '../utils/pricing';

// รายการเริ่มต้นในตะกร้า (ตัวอย่าง)
const INITIAL_CART: CartItem[] = [
  {
    programId: 'flowsync-erp',
    programName: 'FlowSync ERP & Stock',
    thaiName: 'ระบบจัดการคลังสินค้าและตัดสต็อกอัตโนมัติ',
    licenseType: 'monthly_cloud',
    unitPrice: 499,
    quantity: 1,
  },
];

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART);

  const addToCart = (
    program: SoftwareProgram,
    licenseType: CartItem['licenseType']
  ) => {
    const meta = PROGRAM_META[program.id];
    const unitPrice =
      licenseType === 'monthly_cloud'
        ? meta?.singleBuyPrice || program.monthlyPrice
        : program.lifetimePrice;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.programId === program.id && item.licenseType === licenseType
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [
        ...prev,
        {
          programId: program.id,
          programName: program.name,
          thaiName: program.thaiName,
          licenseType,
          unitPrice,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (
    programId: string,
    licenseType: CartItem['licenseType'],
    delta: number
  ) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.programId === programId && item.licenseType === licenseType
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (
    programId: string,
    licenseType: CartItem['licenseType']
  ) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.programId === programId && item.licenseType === licenseType)
      )
    );
  };

  const clearCart = () => setCartItems([]);

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return { cartItems, totalCount, addToCart, updateQuantity, removeItem, clearCart };
}
