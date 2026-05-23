// Strongly-typed interfaces for Payment and Order lean() results

export interface PaymentLean {
  orderId: string;
  customer: string; // ObjectId as string
  artisan: string; // ObjectId as string
  service: string;
  date: string;
  time: string;
  location: string;
  duration: string;
  hourlyRate: number;
  subtotal: number;
  platformFee: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  transactionId?: string;
  rating?: number;
  payoutStatus?: string;
  processedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OrderLean {
  _id: string;
  userId: string;
  contactInfo: any;
  shippingAddress: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    [key: string]: any;
  };
  items: Array<{
    productId: string;
    title: string;
    price: number;
    quantity: number;
    image?: string;
    currency?: string;
    [key: string]: any;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    shipping: number;
    grandTotal: number;
    currency: string;
  };
  status: string;
  paymentMethod: string;
  paymentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
