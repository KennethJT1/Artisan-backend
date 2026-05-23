# Reviews API Contract: Artisan Marketplace

This document describes all endpoints, request/response shapes, and business rules for the reviews system. Use this as the single source of truth for frontend integration.

---

## Review Object
```json
{
  "id": "string",
  "reviewerId": "string",
  "reviewerName": "string",
  "artisanId": "string|null",
  "productId": "string|null",
  "orderId": "string",
  "rating": 1,
  "comment": "string",
  "images": ["string"],
  "status": "pending" | "approved" | "rejected",
  "reported": false,
  "createdAt": "2026-05-23T10:00:00Z",
  "updatedAt": "2026-05-23T10:00:00Z"
}
```

---

## Endpoints & Usage

### 1. List Reviews
**GET** `/reviews?artisanId=...&productId=...&page=1&limit=10`
- Returns paginated, filterable list of reviews for an artisan or product.
- **Response:**
```json
{
  "data": [Review],
  "total": 24,
  "page": 1,
  "limit": 10
}
```

### 2. Aggregate Ratings
**GET** `/reviews/aggregate?artisanId=...&productId=...`
- Returns average rating, total count, and breakdown by star.
- **Response:**
```json
{
  "average": 4.7,
  "total": 24,
  "breakdown": [
    { "rating": 5, "count": 18 },
    { "rating": 4, "count": 4 },
    { "rating": 3, "count": 2 }
  ]
}
```

### 3. Create Review
**POST** `/reviews`
- Only verified buyers (with completed order for artisan/product) can post.
- One review per order per artisan/product.
- **Request:**
```json
{
  "artisanId": "string (optional)",
  "productId": "string (optional)",
  "orderId": "string",
  "rating": 5,
  "comment": "Great service!",
  "images": ["https://cdn.example.com/review1.jpg"]
}
```
- **Response:**
```json
{
  "data": Review
}
```

### 4. Edit Review
**PATCH** `/reviews/:id`
- Only by reviewer, only if not yet moderated.
- **Request:** Partial Review fields (e.g. rating, comment)
- **Response:**
```json
{
  "data": Review
}
```

### 5. Delete Review
**DELETE** `/reviews/:id`
- By reviewer or admin.
- **Response:**
```json
{ "success": true }
```

### 6. Report Review
**POST** `/reviews/:id/report`
- Any user can report inappropriate content.
- **Response:**
```json
{ "success": true }
```

### 7. Admin: List/Moderate Reviews
- **GET** `/reviews/admin/reviews?status=pending&reported=true&page=1&limit=20`
- **PATCH** `/reviews/admin/reviews/:id/moderate` `{ "status": "approved" | "rejected" }`

---

## Business Rules
- Only users with completed orders can review.
- One review per order per artisan/product.
- Reviews default to `pending` and require admin approval.
- Support reporting and moderation.
- All endpoints match the above request/response shapes.

---

## Example Payloads

### List Reviews
```json
{
  "data": [
    {
      "id": "r1",
      "reviewerId": "u1",
      "reviewerName": "Jane Doe",
      "artisanId": "a1",
      "productId": null,
      "orderId": "o1",
      "rating": 5,
      "comment": "Great service!",
      "images": [],
      "status": "approved",
      "reported": false,
      "createdAt": "2026-05-23T10:00:00Z",
      "updatedAt": "2026-05-23T10:00:00Z"
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 10
}
```

### Aggregate Ratings
```json
{
  "average": 4.7,
  "total": 24,
  "breakdown": [
    { "rating": 5, "count": 18 },
    { "rating": 4, "count": 4 },
    { "rating": 3, "count": 2 }
  ]
}
```

### Create Review
```json
{
  "data": {
    "id": "r2",
    "reviewerId": "u2",
    "reviewerName": "John Smith",
    "artisanId": "a1",
    "productId": null,
    "orderId": "o1",
    "rating": 5,
    "comment": "Amazing work!",
    "images": [],
    "status": "pending",
    "reported": false,
    "createdAt": "2026-05-23T11:00:00Z",
    "updatedAt": "2026-05-23T11:00:00Z"
  }
}
```

---

## Frontend Integration Checklist
- Use JWT for all review actions.
- Prevent duplicate review submissions in UI.
- Allow users to rate (1–5), add a comment, and upload up to 5 image URLs.
- Allow editing/deleting only their own review (if not moderated).
- Use `/reviews?productId=...` or `/reviews?artisanId=...` for product/artisan detail pages.
- Use `/reviews/aggregate?...` for average rating and count.
- Use admin endpoints for moderation (approve/reject/delete).
- Show only `status: "approved"` reviews to users.
- Display backend error messages to users (e.g., duplicate review).
- See Swagger docs for more details and try endpoints in `/api`.
