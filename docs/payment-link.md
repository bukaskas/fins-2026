# Flash Payment APIs

RESTful APIs are used for these endpoints due to their established standards, industry support, performance optimizations, and clear semantics.

> The same API is used for **Instapay** or **Flash**. The only difference is the integration ID — you get a different integration ID based on your choice of payment.

## Table of Contents

1. [Access Token generation](#access-token-generation)
2. [Initiate a merchant payment](#initiate-a-merchant-payment)
3. [Retrieve Payment Order Details with Status](#retrieve-payment-order-details-with-status)
4. [Refund a Payment Order](#refund-a-payment-order)
5. [Cancel a Payment Order](#cancel-a-payment-order)
6. [Request payment on Instapay](#request-payment-on-instapay)
7. [Webhook API - Payment Transaction Notifications](#webhook-api---payment-transaction-notifications)
8. [HMAC Signature Calculations](#hmac-signature-calculations)
9. [Send Order Payment Link API](#send-order-payment-link-api)

**Base URL:** `https://stg-api.useflash.app`

---

## Access Token generation

You should first authenticate to get an access token that is required for any request to the API.

**Endpoint:**

```
POST /v1/auth/token
```

**Request Headers:**

- `Content-Type: application/json`
- `Authorization: Basic <base64_encoded_client_credentials>`
- The client ID and secret are sent in the `Authorization` header using the Basic authentication scheme. The client ID and secret are base64-encoded and combined as `client_id:client_secret`.

**Response:**

- On successful authentication, the API generates an `access_token` along with `token_type` (e.g. `"Bearer"`) and `expires_in` indicating the token's expiration time.
- On authentication failure, the API responds with an appropriate error code and message, such as `"invalid_client"`.

**Success (HTTP Status Code: 200)**

```json
{
  "access_token": "<generated_access_token>",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Error (HTTP Status Code: 401)**

```json
{
  "error": "INVALID_CLIENT",
  "error_description": "Invalid client credentials."
}
```

---

## Initiate a merchant payment

**Endpoint:**

```
POST /v1/orders
```

**Request Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <access_token>`

**Request Body**

Required:

- `integrationId` — Identifier for the merchant integration with Flash. Flash will share it with you.
- `aggregatorOrderId` (string, required) — The merchant order id used to identify the order on the merchant side. It should be unique. (e.g. Foodics Order ID)
- `amountCents` (number in cents, required) — The amount to be paid.
- `currency` (string, required) — The currency code, capitalized.

Optional:

- `validity` (number, optional) — In seconds. Default is `86400` for instapay (1 day).
- `orderType` (selection, optional) — One of: `pickup`, `delivery`, `dine-in`, `call_center`, `online`.
  - Note: if the type is `call_center`, the link is sent to the customer via SMS or WhatsApp, so you must set the customer information, otherwise they will not receive the `phoneNumber`.
- `webEnabled` (boolean, default `false`) — If `true`, the user is redirected to a web page first and can pay without installing the Flash app.
- `terminalId` (string, optional) — Identifier for the terminal that will show the QR (like a soundbox device id). The merchant can configure terminal devices from the dashboard.
- `merchantName` (string, optional) — A display name for the merchant.
- `branch` (string, optional) — An identifier for the branch (slug or ID). Helps manage transaction visibility per branch on the merchant dashboard.
- `customer` (object, optional) — Customer info like name and phone number.
- `notifiers` (list of notifier objects, optional) — If included, the courier (or any phone number) receives an SMS/WhatsApp once the transaction is paid. Each notifier has:
  - `phoneNumber` — The phone number that will receive the notification.
  - `type` — `sms`, `whatsapp`, or `app-notification` (for `app-notification`, the recipient should have an account with the same phone number on the Flash courier app).
- `additionalInfo` — Array of key/value pair objects used to attach metadata to the order.

```json
{
  "integrationId": 58328228,
  "aggregatorOrderId": "94fd204c-4f44-477a-8339-471cf6ed41f2",
  "description": "Order for product xyz",
  "customer": {
    "phone": "+20100456432222"
  },
  "branch": "123467889",
  "merchantName": "Lychee",
  "terminalId": "cashier-1",
  "webEnabled": true,
  "amountCents": 5000,
  "currency": "EGP",
  "notifiers": [{
    "phoneNumber": "+201999999222",
    "type": "sms"
  }],
  "additionalInfo": [{ "key": "product-code", "value": "lkmew" }]
}
```

**Response**

Fields:

- `order` (object, required) — Order object with the order details that were added. The status of the created order will be `pending`, and after the user pays it can become `failed` or `succeeded`.
- `paymentLink` (url, required) — The payment link that the user should use to pay. You can display it as a QR code.

Notes:

- The API always returns a payment link even if the phone number isn't registered, so the user can scan the QR to download the app, sign up, and pay directly through the app. The API handles various phone number formats (with or without country codes, and specific formatting rules) to ensure compatibility.
- The API validates the request and generates a unique order ID for the scan & pay process.
- On error, the response includes an appropriate error code and message describing the issue.
- For Instapay, the `paymentLink` will be the instapay QR payload.

**Success (HTTP Status Code: 201)**

```json
{
  "order": {
    "id": "string",
    "merchantId": "string",
    "aggregatorOrderId": "string",
    "billingInfo": {
      "customerName": "string",
      "phoneNumber": "string"
    },
    "amountCents": 100,
    "createdAt": "2023-08-06T18:14:55.230Z",
    "updatedAt": "2023-08-06T18:14:55.230Z",
    "status": "pending",
    "additionalInfo": [{ "key": "product-code", "value": "lkmew" }]
  },
  "paymentLink": "https://pay.useflash.app/JSXET"
}
```

**Expected Error Codes:**

1. `EMPTY_AGGREGATOR_ORDER_ID` — when the request `aggregatorOrderId` is empty.
2. `EMPTY_AMOUNT` — when the request `amountCents` is empty.
3. `DUPLICATE_ORDER` — when an order with the same `aggregatorOrderId` already exists.
4. `MERCHANT_NOT_FOUND` — when a wrong `merchantId` is sent.
5. `INTEGRATION_NOT_FOUND` — when there is no integration with the entered `merchantId`.
6. `ORDER_BELOW_MINIMUM` — when the `amountCents` is less than 5 EGP.

**Error Response Sample**

```json
{
  "error": {
    "code": "INTEGRATION_NOT_FOUND",
    "message": "We didn't find a matched integrationId"
  }
}
```

---

## Retrieve Payment Order Details with Status

**Endpoint:**

```
GET /v1/orders/aggregator/{aggregatorOrderId}
```

**Request Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <access_token>`

**Request Parameters** (URL parameter):

- `aggregatorOrderId` (string, required) — The identifier of the merchant order to fetch.

**Response:**

- The endpoint accepts an order id to identify the specific order to fetch.
- If the order is found, the API responds with the order details including the order id, amount, currency, status, timestamp, and customer details (name and phone).
- On error (e.g. order not found), the API responds with an appropriate error code and message.

**Success (HTTP Status Code: 200)**

```json
{
  "id": "94fd204c-4f44-477a-8339-471cf6ed41f2",
  "aggregatorOrderId": "94fd204c-4f44-477a-8339-471cf6ed4w235",
  "amountCents": 5000,
  "currency": "EGP",
  "status": "pending",
  "createdAt": "2023-06-11T12:34:56Z",
  "billingInfo": {
    "customerName": "Ahmed Mostafa",
    "phoneNumber": "+201005398662"
  }
}
```

**Error (HTTP Status Code: 404)**

```json
{
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "The requested order could not be found."
  }
}
```

**Expected Error Codes:**

1. `EMPTY_AGGREGATOR_ORDER_ID` — when the request `aggregatorOrderId` is empty.
2. `ORDER_NOT_FOUND` — when the order is not found.

---

## Refund a Payment Order

**Endpoint:**

```
POST /v1/orders/refund
```

**Request Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <access_token>`

**Request Body:**

- `orderId` (string, optional) — The identifier of the original flash order ID being refunded.
- `merchantOrderId` (string, optional) — The identifier of the merchant order ID being refunded.
- `amountCents` (number in cents, optional) — The amount to be refunded.
- `currency` (string, required) — The currency code, capitalized.
- `reason` (string, optional) — An optional reason or description for the refund.

> You should provide at least one of `orderId` or `merchantOrderId`. Otherwise the refund request will not be accepted.

```json
{
  "orderId": "94fd204c-4f44-477a-8339-471cf6ed41f2",
  "amountCents": 5000,
  "currency": "EGP",
  "reason": "Customer requested a refund"
}
```

**Response:**

- The API verifies the order ID and amount.
- If the refund is valid, it processes the refund and generates a unique `refundId`.
- The response includes the `refundId`, `orderId`, amount refunded, status, and a timestamp.
- On error, the response includes an appropriate error code and message.

**Success (HTTP Status Code: 200)**

```json
{
  "refundId": "93d9e076-8ed5-4d69-b8b3-9b00e5efea52",
  "orderId": "94fd204c-4f44-477a-8339-471cf6ed41f2",
  "amountCents": 5000,
  "currency": "EGP",
  "status": "refunded",
  "createdAt": "2023-06-11T12:34:56Z"
}
```

**Error (HTTP Status Code: 400/500)**

- Status code `400` for bad requests.
- Status code `500` for unexpected errors.

```json
{
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "The refund amount exceeds the original order amount."
  }
}
```

**Expected Error Codes:**

1. `EMPTY_ORDER_ID` — when the request order id is empty.
2. `PAYMENT_NOT_FOUND` — when nobody tried to pay the order.
3. `Transaction_Invalid_Status` — when the order payment status isn't successful.
4. `ORDER_NOT_FOUND` — when the requested order doesn't exist.
5. `INVALID_REFUND_AMOUNT` — when you send an amount greater than the available amount to refund.
6. `ALREADY_REFUNDED` — when the order has already been fully refunded.

---

## Cancel a Payment Order

**Endpoint:**

```
POST /v1/orders/cancel
```

**Request Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <access_token>`

**Request Body:**

- `orderId` (string, optional) — The identifier of the original flash order ID being canceled.
- `merchantOrderId` (string, optional) — The identifier of the merchant order ID being canceled.
- `reason` (string, optional) — An optional reason or description for the cancellation.

> You should provide at least one of `orderId` or `merchantOrderId`. Otherwise the cancel request will not be accepted.

```json
{
  "merchantOrderId": "94fd204c-4f44-477a-8339-471cf6ed41f2",
  "reason": "Customer requested a cancel"
}
```

**Response:**

- The API validates the order ID and order status.
- If the order is still `pending` and the user didn't pay it, it processes the cancellation.
- On error, the response includes an appropriate error code and message.

**Success (HTTP Status Code: 200)**

```json
{
  "orderId": "94fd204c-4f44-477a-8339-471cf6ed41f2",
  "amountCents": 5000,
  "currency": "EGP",
  "status": "canceled",
  "createdAt": "2023-06-11T12:34:56Z"
}
```

**Error (HTTP Status Code: 400/500)**

- Status code `400` for bad requests.
- Status code `500` for unexpected errors.

```json
{
  "error": {
    "code": "EMPTY_ORDER_ID",
    "message": "please provide at least one of orderId or merchantOrderId"
  }
}
```

**Expected Error Codes:**

1. `EMPTY_ORDER_ID` — when the request order id is empty.
2. `ORDER_ALREADY_PAID` — when the order payment status is successful or refunded.
3. `INVALID_STATUS` — the order status isn't `pending`, so it can't be canceled.

---

## Request payment on Instapay

**Endpoint:**

```
POST /v1/orders/instapay/request-pay
```

**Request Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <access_token>`

**Request Body**

Required:

- `customer` (object, required) — Customer info like name and phone number.
- `aggregatorOrderId` (string, optional) — The identifier of the merchant order ID.
- `amountCents` (number in cents, required) — The amount to be paid.
- `currency` (string, required) — The currency code, capitalized.
- `integrationId` — Identifier for the merchant integration with Flash. Flash will share it with you.

Optional:

- `validity` (number, optional) — In seconds. Default is `86400` for instapay (1 day).
- `orderType` (selection, optional) — One of: `pickup`, `delivery`, `dine-in`, `call-center`.
  - Note: if the type is `call-center`, the link is sent to the customer via SMS or WhatsApp, so you must set the customer information, otherwise they will not receive the `phoneNumber`.
- `merchantName` (string, optional) — A display name for the merchant.
- `branch` (string, optional) — An identifier for the branch (slug or ID). Helps manage transaction visibility per branch on the merchant dashboard.

```json
{
  "integrationId": 58328228,
  "aggregatorOrderId": "94fd204c-4f44-477a-8339-471cf6ed41f2",
  "customer": {
    "phone": "+20100456432222"
  },
  "branch": "123467889",
  "merchantName": "Lychee",
  "amountCents": 5000,
  "currency": "EGP"
}
```

**Success (HTTP Status Code: 200)**

```json
{
  "orderId": "94fd204c-4f44-477a-8339-471cf6ed41f2",
  "amountCents": 5000,
  "currency": "EGP",
  "status": "pending",
  "createdAt": "2023-06-11T12:34:56Z"
}
```

---

## Webhook API - Payment Transaction Notifications

The Payment Transaction Webhook API allows you to receive real-time notifications about payment transactions on your platform.

**Endpoint:**

```
URL: https://www.example.com/webhooks/transaction-callback
Method: POST
```

The merchant should share the callback URL with Flash. The default signing is **HMAC-SHA256**. The signing secret will be shared with the merchant.

**Request Headers:**

- `Content-Type: application/json`
- `signature` — HMAC-SHA256 hash of the payload using the shared secret key.

**Request Payload:**

The webhook request includes a JSON payload containing the payment transaction details:

```json
{
  "integrationId": 6741,
  "channelId": 61,
  "transactionId": "payment_transaction_id",
  "aggregatorOrderId": "merchant_order_id",
  "order": {
    "id": "flash_order_id",
    "description": "Order for product xyz",
    "customer": {
      "name": "customer name",
      "phone": "+20100456432222"
    },
    "amountCents": 5000,
    "currency": "EGP",
    "paymentLink": "https://pay.useflash.app/JSXET",
    "createdAt": "1735930920",
    "AdditionalInfo": { "trackingNumber": "1234456677" }
  },
  "PaidAmountCents": 5000,
  "status": "succeeded",
  "updatedAt": "1735930929"
}
```

**Expected transaction status:**

1. `pending` — created and currently awaiting processing.
2. `processing` — actively being handled and processed by the system.
3. `failed` — unsuccessful or encountered an error during processing.
4. `succeeded` — completed successfully.
5. `refunded` — the amount of the transaction has been returned to the user.
6. `canceled` — intentionally canceled. This can occur if the user fails or cancels the 2FA verification step on the mobile app.

---

## HMAC Signature Calculations

HMAC is commonly used for ensuring data integrity and authentication by generating a cryptographic signature based on a shared secret key.

> Implement this in a generic way to support any JSON payload, to avoid breaking the signature if Flash adds a new field to the payload.

### Step 1: Prepare the JSON Object

The JSON object may contain simple key-value pairs as well as nested objects. The structure should be flattened into a single-level structure for signature calculation.

```json
{
  "integrationId": 6741,
  "transactionId": "payment_transaction_id",
  "aggregatorOrderId": "merchant_order_id",
  "order.id": "flash_order_id",
  "order.description": "Order for product xyz",
  "order.customer.name": "customer name",
  "order.customer.phone": "+20100456432222",
  "order.amountCents": 5000,
  "order.currency": "EGP",
  "order.paymentLink": "https://pay.useflash.app/JSXET",
  "order.createdAt": "1735930920",
  "status": "succeeded",
  "updatedAt": "1735930929"
}
```

### Step 2: Omit any empty keys

The flattened JSON object shouldn't have any empty values. Remove such keys if they exist.

### Step 3: Sort the keys alphabetically

Before generating the signature, ensure the keys in the JSON object are sorted alphabetically. This ensures consistency in the signature calculation process.

### Step 4: Convert it into a KV pairs string

Once the object is flattened and the keys are sorted, concatenate the key-value pairs into a string using a consistent format, such as `key1=value1,key2=value2`:

```
aggregatorOrderId=merchant_order_id,integrationId=6741,order.amountCents=5000,order.createdAt=1735930920,order.currency=EGP,order.customer.name=customer name,order.customer.phone=+20100456432222,order.description=Order for product xyz,order.id=flash_order_id,order.paymentLink=https://pay.useflash.app/JSXET,status=succeeded,transactionId=payment_transaction_id,updatedAt=1735930929
```

### Step 5: Calculate the signature

Once you have the string ready, generate the HMAC signature using your preferred language to sign the output string with the secret key (Flash will share it with you).

Example in Python:

```python
signature = hmac.new(secret_key, payload_string.encode('utf-8'), hashlib.sha256).hexdigest()
```

---

## Send Order Payment Link API

### Overview

Sends a pending order payment link to a customer by SMS or WhatsApp.

> This feature isn't enabled by default. If you want to use it, ask Flash to turn it on.

**Endpoint:**

```
POST /v1/orders/send
```

**Request Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <access_token>`

**Request Body:**

- `orderId` (string) — The identifier of the original flash order ID.
- `recipient` (string) — Customer mobile number with country code, for example `+2010XXXXXXXX`.
- `channel` (string) — Delivery channel. Allowed values: `sms`, `whatsapp`.

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "recipient": "+2010XXXXXXXX",
  "channel": "sms"
}
```

**Success (HTTP Status Code: 200)**

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error (HTTP Status Code: 400/500)**

- Status code `400` for bad requests.
- Status code `500` for unexpected errors.

```json
{
  "error": {
    "code": "ORDER_SEND_ATTEMPTS_EXCEEDED",
    "message": "Order send attempts exceeded."
  }
}
```

**Expected Error Codes:**

- `ORDER_SEND_ATTEMPTS_EXCEEDED` — only 3 attempts are allowed per order.
