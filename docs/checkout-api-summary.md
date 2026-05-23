
# Checkout, Order, and Payment API Summary

## Cart Implementation Changes

**Before:**
- Cart endpoints used `/cart/items` for add/update, and required full product details (title, price, image, etc.) in the payload.
- Cart was keyed by userId as an ObjectId, which caused issues with cart persistence and updates.
- No single endpoint to replace all cart items at once.

**Now:**
- Cart endpoints use only `productId` and `quantity` for add/update; product details are fetched server-side.
- Cart is keyed by userId as a string, ensuring persistence and correct updates.
- New endpoints:
	- `POST /cart` — Replace all items in the cart (for checkout flow).
	- `DELETE /cart/:itemId` — Remove a single item by productId.
- All cart endpoints are JWT-protected and return `{ data: ... }` responses.

---

## API Request & Response Examples

### 1. Get Current User
**GET /users/me**
- **Request:** (JWT required)
- **Response:**
```json
{
	"firstName": "Jane",
	"lastName": "Doe",
	"email": "jane@example.com",
	"phone": "+1234567890"
}
```

---

### 2. Get Cart
**GET /cart**
- **Request:** (JWT required)
- **Response:**
```json
{
	"data": {
		"_id": "cartId",
		"items": [
			{
				"productId": "abc123",
				"title": "Product Name",
				"price": 100,
				"image": "https://...",
				"quantity": 2,
				"currency": "USD"
			}
		],
		"totals": {
			"subtotal": 200,
			"discount": 0,
			"tax": 10,
			"shipping": 10,
			"grandTotal": 220,
			"currency": "USD"
		}
	}
}
```

---

### 3. Replace All Cart Items
**POST /cart**
- **Request:**
```json
{
	"items": [
		{ "productId": "abc123", "quantity": 2 },
		{ "productId": "def456", "quantity": 1 }
	]
}
```
- **Response:** Same as GET /cart

---

### 4. Remove Item from Cart
**DELETE /cart/:itemId**
- **Request:** (JWT required, :itemId = productId)
- **Response:** Same as GET /cart

---

### 5. Place Order
**POST /orders**
- **Request:**
```json
{
	"contactInfo": {
		"firstName": "Jane",
		"lastName": "Doe",
		"email": "jane@example.com",
		"phone": "+1234567890"
	},
	"shippingAddress": {
		"street": "123 Main St",
		"city": "Lagos",
		"state": "Lagos",
		"postalCode": "100001",
		"country": "Nigeria"
	},
	"items": [
		{ "productId": "abc123", "title": "Product Name", "price": 100, "quantity": 2, "image": "https://..." }
	],
	"totals": {
		"subtotal": 200,
		"discount": 0,
		"tax": 10,
		"shipping": 10,
		"grandTotal": 220,
		"currency": "USD"
	},
	"paymentMethod": "paystack"
}
```
- **Response:**
```json
{
	"orderId": "orderId123",
	"status": "pending"
}
```

---

### 6. Get Order Details
**GET /orders/:orderId**
- **Request:** (JWT required)
- **Response:** (Order object, same as POST /orders request, plus status, createdAt, etc.)

---

### 7. List User Orders
**GET /orders**
- **Request:** (JWT required)
- **Response:**
```json
{
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "data": [
        {
            "_id": "6a112ef49bb8a8823d07b4ee",
            "userId": "68e600a8841f724a33e5e2e9",
            "contactInfo": {
                "firstName": "Jane",
                "lastName": "Doe",
                "email": "jane@example.com",
                "phone": "+1234567890"
            },
            "shippingAddress": {
                "street": "123 Main St",
                "city": "Lagos",
                "state": "Lagos",
                "postalCode": "100001",
                "country": "Nigeria"
            },
            "items": [
                {
                    "productId": "68e772efae669f57fcc4dc72",
                    "title": "Bridal Makeup Session",
                    "price": 85000,
                    "image": "https://images.squarespace-cdn.com/content/v1/6072d30171a87f24cf740953/d271a048-ce3e-4df3-8194-fd3f3cecaac6/7V8A0844.jpg",
                    "quantity": 2,
                    "currency": "USD"
                },
                {
                    "productId": "68e772efae669f57fcc4dc54",
                    "title": "Facial Moisturizing Cream",
                    "price": 9500,
                    "image": "https://images.unsplash.com/photo-1601049676869-702ea24cfdc1?w=800&q=80",
                    "quantity": 5,
                    "currency": "USD"
                }
            ],
            "totals": {
                "subtotal": 217500,
                "discount": 0,
                "tax": 10875,
                "shipping": 10,
                "grandTotal": 228385,
                "currency": "USD",
                "_id": "6a112ef49bb8a8823d07b4ef"
            },
            "status": "pending",
            "paymentMethod": "paystack",
            "createdAt": "2026-05-23T04:37:08.060Z",
            "updatedAt": "2026-05-23T04:37:08.060Z",
            "__v": 0
        }
    ]
}
```

---

### 8. Initiate Paystack Payment
**POST /payments/paystack/initiate**
- **Request:**
```json
{
	"orderId": "orderId123",
	"amount": 220,
	"email": "jane@example.com"
}
```
- **Response:**
```json
{
	"paystackReference": "PSK-1234567890",
	"paymentUrl": "https://paystack.com/pay/PSK-1234567890"
}
```

---

### 9. Paystack Webhook
**POST /payments/paystack/webhook**
- **Request:** (Paystack sends this)
```json
{
	"reference": "PSK-1234567890",
	"status": "success"
}
```
- **Response:**
```json
{ "success": true }
```

already existing
{
    "message": "Payment for this order has already been completed.",
    "error": "Bad Request",
    "statusCode": 400
}
---

### 10. Get Payment Status
**GET /payments/:orderId**
- **Request:** (JWT required)
- **Response:**
```json
{
	"orderId": "orderId123",
	"userId": "userId123",
	"method": "paystack",
	"status": "pending",
	"paystackReference": "PSK-1234567890",
	"amount": 220
}
```

---

## Main Files Created
- `src/orders/dto/create-order.dto.ts` — DTOs for order creation
- `src/orders/schemas/order.schema.ts` — Mongoose schema for Order
- `src/orders/orders.controller.ts` — Order endpoints
- `src/orders/orders.service.ts` — Order business logic
- `src/orders/orders.module.ts` — Order module
- `src/payments/dto/initiate-paystack-payment.dto.ts` — DTO for Paystack payment
- `src/payments/schemas/payment.schema.ts` — Mongoose schema for Payment
- `src/payments/payments.controller.ts` — Payment endpoints
- `src/payments/payments.service.ts` — Payment business logic
- `src/payments/payments.module.ts` — Payment module

## Notes
- All endpoints (except webhook) require JWT authentication.
- All payment logic is Paystack-only.
- Use the documented request/response payloads in Postman for testing.
- All business logic is implemented in NestJS with MongoDB.
