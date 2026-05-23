# Backend Cart API Prompt for Copilot Agent (NestJS + MongoDB)

## Purpose
This file contains the exact prompt and payloads to provide to a backend Copilot agent for generating a cart management API compatible with the current frontend.

---

## Prompt

I am building a cart management system for an artisan marketplace. The frontend expects the following API endpoints and payloads for cart operations. Please generate the NestJS (with MongoDB) controller, service, DTOs, and Mongoose schemas to support these endpoints and payloads.

### Endpoints and Payloads:

1. **GET /cart**
    - Returns the current cart for the user.
    - Response:
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

2. **POST /cart/items**
    - Adds items to the cart.
    - Request:
      ```json
      {
        "items": [
          {
            "productId": "string",
            "title": "string",
            "price": 0,
            "image": "string",
            "quantity": 0,
            "currency": "string"
          }
        ]
      }
      ```
    - Response: Same as GET /cart.

3. **PATCH /cart/items**
    - Updates items in the cart (e.g., quantity).
    - Request: Same as POST /cart/items.
    - Response: Same as GET /cart.

4. **DELETE /cart/items/:productId**
    - Removes an item from the cart.
    - Response: Same as GET /cart.

5. **DELETE /cart/clear**
    - Clears the cart.
    - Response: Same as GET /cart.

6. **POST /cart/coupon**
    - Applies a coupon.
    - Request:
      ```json
      { "couponCode": "string" }
      ```
    - Response: Same as GET /cart.

7. **DELETE /cart/coupon**
    - Removes the coupon.
    - Response: Same as GET /cart.

### Requirements:
- Use NestJS controllers, services, DTOs, and Mongoose schemas.
- The cart should be associated with a user (assume user ID is available via auth middleware).
- Calculate totals (subtotal, discount, tax, shipping, grandTotal) on the backend.
- Return all responses in the format `{ data: ... }`.
- Ensure all fields match the payloads above.

Please generate the code for the controller, service, DTOs, and Mongoose schemas.
