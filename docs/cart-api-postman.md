# Cart API Endpoints & Postman Payloads

## 1. Get Cart
- **Endpoint:** `GET /cart`
- **Description:** Returns the current cart for the user.
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Response Example:**
```json
{
  "data": {
    "_id": "string",
    "items": [
      {
        "productId": "string",
        "title": "string",
        "price": 0,
        "image": "string",
        "quantity": 0,
        "currency": "string"
      }
    ],
    "totals": {
      "subtotal": 0,
      "discount": 0,
      "tax": 0,
      "shipping": 0,
      "grandTotal": 0,
      "currency": "string"
    }
  }
}
```

---

## 2. Add Items to Cart
- **Endpoint:** `POST /cart/items`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Body:**
```json
{
    "items": [
        {
            "productId": "68e772efae669f57fcc4dc72",
            "quantity": 2
        },
        {
            "productId": "68e772efae669f57fcc4dc54",
            "quantity": 5
        }
    ]
}
```
- **Response:** Same as Get Cart

---

## 3. Update Items in Cart
- **Endpoint:** `PATCH /cart/items`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Body:**
```json
{
    "items": [
        {
            "productId": "68e772efae669f57fcc4dc72",
            "quantity": 1
        },
        {
            "productId": "68e772efae669f57fcc4dc54",
            "quantity": 2
        }
    ]
}
```
- **Response:** Same as Get Cart

---

## 4. Remove Item from Cart
- **Endpoint:** `DELETE /cart/items/:productId`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Response:** Same as Get Cart

---

## 5. Clear Cart
- **Endpoint:** `DELETE /cart/clear`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Response:** Same as Get Cart

---

## 6. Apply Coupon
- **Endpoint:** `POST /cart/coupon`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Body:**
```json
{
  "couponCode": "string"
}
```
- **Response:** Same as Get Cart

---

## 7. Remove Coupon
- **Endpoint:** `DELETE /cart/coupon`
- **Headers:**
  - `Authorization: Bearer <JWT_TOKEN>`
- **Response:** Same as Get Cart

---

## Notes
- All endpoints require authentication (JWT Bearer token).
- All responses are wrapped in `{ "data": ... }`.
- Replace `string` and `0` with actual values as needed.
