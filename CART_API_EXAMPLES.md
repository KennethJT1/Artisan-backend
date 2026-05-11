# Cart API - Request Examples

Base URL: `http://localhost:3000/api/cart`

All endpoints require `Authorization: Bearer {JWT_TOKEN}` header.

---

## 1. Add Items to Cart

**Endpoint:** `POST /items`

**Simple Request:**
```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "quantity": 2
      }
    ]
  }'
```

**With Variants:**
```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "quantity": 1,
        "variant": {
          "size": "Medium",
          "color": "Red"
        }
      },
      {
        "productId": "507f1f77bcf86cd799439012",
        "quantity": 3,
        "variant": {
          "size": "Large",
          "color": "Blue"
        }
      }
    ]
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Items added to cart",
  "data": {
    "subtotal": 255000,
    "discount": 0,
    "tax": 12750,
    "total": 267750,
    "itemCount": 4,
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "Bridal Makeup Session",
        "image": "https://images.squarespace-cdn.com/content/...",
        "unitPrice": 85000,
        "discount": 0,
        "quantity": 2,
        "totalPrice": 170000,
        "sku": "BRIDAL-001",
        "variant": {},
        "stock": 50,
        "isAvailable": true,
        "addedAt": "2026-05-11T10:00:00Z"
      },
      {
        "productId": "507f1f77bcf86cd799439012",
        "name": "Hair Styling",
        "image": "https://...",
        "unitPrice": 85000,
        "discount": 0,
        "quantity": 2,
        "totalPrice": 170000,
        "sku": "HAIR-001",
        "variant": {},
        "stock": 30,
        "isAvailable": true,
        "addedAt": "2026-05-11T10:00:00Z"
      }
    ]
  }
}
```

**Error Response - Out of Stock (409):**
```json
{
  "statusCode": 409,
  "message": "Insufficient stock for 'Bridal Makeup Session'. Available: 5",
  "error": "Conflict"
}
```

**Error Response - Product Not Found (404):**
```json
{
  "statusCode": 404,
  "message": "Product not found: 507f1f77bcf86cd799439999",
  "error": "Not Found"
}
```

---

## 2. Get Cart

**Endpoint:** `GET /`

```bash
curl -X GET http://localhost:3000/api/cart \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cart fetched",
  "data": {
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "Bridal Makeup Session",
        "image": "https://images.squarespace-cdn.com/content/...",
        "unitPrice": 85000,
        "discount": 0,
        "quantity": 2,
        "totalPrice": 170000,
        "sku": "BRIDAL-001",
        "variant": {},
        "stock": 50,
        "isAvailable": true,
        "addedAt": "2026-05-11T10:00:00Z"
      }
    ],
    "subtotal": 170000,
    "discount": 0,
    "tax": 8500,
    "total": 178500,
    "itemCount": 2,
    "couponCode": null
  }
}
```

**Empty Cart Response:**
```json
{
  "success": true,
  "message": "Cart is empty",
  "data": {
    "items": [],
    "subtotal": 0,
    "discount": 0,
    "tax": 0,
    "total": 0,
    "couponCode": null,
    "itemCount": 0
  }
}
```

---

## 3. Update Cart Item Quantities

**Endpoint:** `PATCH /items`

```bash
curl -X PATCH http://localhost:3000/api/cart/items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "quantity": 5,
        "maxQuantity": 10
      },
      {
        "productId": "507f1f77bcf86cd799439012",
        "quantity": 2
      }
    ]
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cart updated",
  "data": {
    "subtotal": 425000,
    "discount": 0,
    "tax": 21250,
    "total": 446250,
    "itemCount": 7,
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "Bridal Makeup Session",
        "image": "https://...",
        "unitPrice": 85000,
        "discount": 0,
        "quantity": 5,
        "totalPrice": 425000,
        "sku": "BRIDAL-001",
        "variant": {},
        "stock": 50,
        "isAvailable": true,
        "addedAt": "2026-05-11T10:00:00Z"
      }
    ]
  }
}
```

---

## 4. Remove Single Item

**Endpoint:** `DELETE /items/:productId`

```bash
curl -X DELETE http://localhost:3000/api/cart/items/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Item removed from cart",
  "data": {
    "subtotal": 85000,
    "discount": 0,
    "tax": 4250,
    "total": 89250,
    "itemCount": 1,
    "items": [
      {
        "productId": "507f1f77bcf86cd799439012",
        "name": "Hair Styling",
        "image": "https://...",
        "unitPrice": 85000,
        "quantity": 1,
        "totalPrice": 85000,
        "sku": "HAIR-001",
        "variant": {},
        "stock": 30,
        "isAvailable": true,
        "addedAt": "2026-05-11T10:01:00Z"
      }
    ]
  }
}
```

**Error Response - Not Found (404):**
```json
{
  "statusCode": 404,
  "message": "Product 507f1f77bcf86cd799439999 not found in cart",
  "error": "Not Found"
}
```

---

## 5. Clear All Items

**Endpoint:** `DELETE /items/clear` or `DELETE /clear`

```bash
curl -X DELETE http://localhost:3000/api/cart/items/clear \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cart cleared",
  "data": {
    "items": [],
    "subtotal": 0,
    "discount": 0,
    "tax": 0,
    "total": 0,
    "couponCode": null,
    "itemCount": 0
  }
}
```

---

## 6. Apply Coupon Code

**Endpoint:** `POST /coupon`

```bash
curl -X POST http://localhost:3000/api/cart/coupon \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "couponCode": "SUMMER20"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Coupon applied",
  "data": {
    "subtotal": 170000,
    "discount": 34000,
    "tax": 6800,
    "total": 142800,
    "itemCount": 2,
    "couponCode": "SUMMER20",
    "items": [...]
  }
}
```

**Error Response - Invalid Coupon (400):**
```json
{
  "statusCode": 400,
  "message": "Invalid or expired coupon code",
  "error": "Bad Request"
}
```

---

## 7. Remove Coupon Code

**Endpoint:** `DELETE /coupon`

```bash
curl -X DELETE http://localhost:3000/api/cart/coupon \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Coupon removed",
  "data": {
    "subtotal": 170000,
    "discount": 0,
    "tax": 8500,
    "total": 178500,
    "itemCount": 2,
    "couponCode": null,
    "items": [...]
  }
}
```

---

## Error Handling Examples

### 400 - Bad Request (Invalid Quantity)
```json
{
  "statusCode": 400,
  "message": "Quantity must be between 1 and 999",
  "error": "Bad Request"
}
```

### 400 - Bad Request (Empty Items Array)
```json
{
  "statusCode": 400,
  "message": "Items array must not be empty",
  "error": "Bad Request"
}
```

### 404 - Not Found (Cart Not Found)
```json
{
  "statusCode": 404,
  "message": "Cart not found",
  "error": "Not Found"
}
```

### 409 - Conflict (Exceeds Max Items)
```json
{
  "statusCode": 409,
  "message": "Cart cannot exceed 100 items. Current: 98",
  "error": "Conflict"
}
```

### 409 - Conflict (Product No Longer Available)
```json
{
  "statusCode": 409,
  "message": "Product \"Bridal Makeup Session\" is no longer available",
  "error": "Conflict"
}
```

### 401 - Unauthorized (Missing Token)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

---

## JavaScript/Fetch Examples

### Add to Cart
```javascript
const response = await fetch('http://localhost:3000/api/cart/items', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    items: [
      { productId: '507f1f77bcf86cd799439011', quantity: 2 },
    ],
  }),
});

const data = await response.json();
console.log(data);
```

### Get Cart
```javascript
const response = await fetch('http://localhost:3000/api/cart', {
  headers: { 'Authorization': `Bearer ${token}` },
});

const cart = await response.json();
console.log(cart.data.total);
```

### Clear Cart
```javascript
const response = await fetch('http://localhost:3000/api/cart/clear', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` },
});

const result = await response.json();
console.log(result.message); // "Cart cleared"
```

---

## Test Cases

### Test 1: Simple Add and View
1. `POST /items` with product ID
2. `GET /` to view cart
3. Verify total calculations

### Test 2: Quantity Merge
1. `POST /items` with product A, qty 2
2. `POST /items` with product A, qty 3
3. Verify quantity is 5, not 2 items in cart

### Test 3: Variant Handling
1. `POST /items` with product A, variant {size: M}
2. `POST /items` with product A, variant {size: L}
3. Verify 2 separate items in cart

### Test 4: Price Calculations
1. Add items totaling 100,000
2. Verify: subtotal=100000, tax=5000, total=105000 (5% tax)

### Test 5: Coupon Application
1. Add items
2. Apply coupon
3. Verify discount amount reduced total

---

**Ready to integrate into your frontend! 🚀**
