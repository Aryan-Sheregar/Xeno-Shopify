# Xeno-Shopify

Xeno-Shopify is a web-based dashboard that provides analytics and insights for Shopify stores. It features a React frontend and a Node.js backend to sync and visualize data from Shopify.

## Features

- **Dashboard:** An overview of key metrics, including total customers, products, and revenue.
- **Multi-Tenant Support:** Manage multiple Shopify stores from a single application.
- **Data Synchronization:** Sync customers, products, and orders from your Shopify store.
- **Analytics:** View detailed analytics for customers and products.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, Sequelize, MySQL
- **Shopify Integration:** Shopify API

## Prerequisites

- Node.js (v18 or higher)
- npm
- MySQL
- A Shopify store with API access credentials

## Installation

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file and add the following environment variables:
    ```env
    PORT=5000
    DB_HOST=your_db_host
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=your_db_name
    SHOPIFY_STORE_DOMAIN=your_shopify_store_domain
    SHOPIFY_ACCESS_TOKEN=your_shopify_access_token
    FRONTEND_URL=http://localhost:5173
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

### Frontend

1.  Navigate to the `frontend/XenoFront` directory:
    ```bash
    cd frontend/XenoFront
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file and add the following environment variable:
    ```env
    VITE_API_URL=http://localhost:5000
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
#### API Endpoints

The backend exposes the following API endpoints:

-   `GET /api/health`: Checks the health of the server and database connection.
-   `GET /api/tenants`: Retrieves a list of all active tenants.
-   `POST /api/tenants`: Creates a new tenant.
-   `DELETE /api/tenants/:tenantId`: Deletes a tenant.
-   `GET /api/dashboard/:tenantId`: Retrieves comprehensive dashboard data for a given tenant.
-   `POST /api/shopify/sync/:tenantId`: Triggers a full data sync for a tenant, fetching customers, products, and orders from Shopify.
-   `POST /api/webhooks/shopify`: A webhook endpoint for receiving real-time updates from Shopify.

#### Data Models

The application uses the following data models, managed by Sequelize:

##### Tenant

-   `id` (UUID, Primary Key)
-   `name` (String)
-   `shopifyDomain` (String)
-   `shopifyAccessToken` (Text)
-   `isActive` (Boolean)

##### Customer

-   `id` (UUID, Primary Key)
-   `tenantId` (UUID, Foreign Key)
-   `shopifyCustomerId` (String)
-   `firstName` (String)
-   `lastName` (String)
-   `email` (String)
-   `phone` (String)
-   `totalSpent` (Decimal)
-   `ordersCount` (Integer)

##### Product

-   `id` (UUID, Primary Key)
-   `tenantId` (UUID, Foreign Key)
-   `shopifyProductId` (String)
-   `title` (String)
-   `description` (Text)
-   `price` (Decimal)
-   `inventory` (Integer)

##### Order

-   `id` (UUID, Primary Key)
-   `tenantId` (UUID, Foreign Key)
-   `customerId` (UUID, Foreign Key)
-   `shopifyOrderId` (String)
-   `orderNumber` (String)
-   `totalAmount` (Decimal)
-   `status` (Enum: "pending", "confirmed", "shipped", "delivered", "cancelled")
-   `orderDate` (Date)

##### OrderLineItem

-   `id` (UUID, Primary Key)
-   `orderId` (UUID, Foreign Key)
-   `productId` (UUID, Foreign Key)
-   `quantity` (Integer)
-   `unitPrice` (Decimal)
-   `totalPrice` (Decimal)

# Workflow
<img width="947" height="308" alt="Image" src="https://github.com/user-attachments/assets/8d7124e5-7629-4d12-8e81-e745a107fb4a" />
