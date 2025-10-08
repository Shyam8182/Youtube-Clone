# YouTube Clone Backend

[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/Shyam8182/Youtube-Clone)

This repository contains the backend service for a YouTube clone application. It is built using Node.js, Express, and MongoDB, providing a robust foundation for handling user authentication, video data, subscriptions, and more.

## Features

-   **User Authentication**: Secure user registration and login system using JWT (JSON Web Tokens) with access and refresh tokens.
-   **Password Hashing**: Passwords are encrypted using `bcrypt` before being stored.
-   **Media Uploads**: Integration with Cloudinary for seamless handling of image and video uploads.
-   **Middleware Integration**: Uses `multer` for handling `multipart/form-data` and custom middleware for authentication checks.
-   **Structured API**: Well-organized API with dedicated routes, controllers, and utility functions for better maintainability.
-   **Custom API Responders**: Standardized API response and error handling classes (`ApiResponse`, `ApiError`).
-   **Database Modeling**:
    -   `User`: Manages user data including profile information, credentials, and media URLs.
    -   `Video`: Stores video details like title, description, duration, and associated user.
    -   `Subscription`: Manages user-to-channel subscription relationships.

## Tech Stack

-   **Backend**: Node.js, Express.js
-   **Database**: MongoDB with Mongoose
-   **Authentication**: JSON Web Token (jsonwebtoken), bcrypt
-   **File Management**: Cloudinary, Multer
-   **Environment Variables**: dotenv
-   **Development**: Nodemon, Prettier
-   **Other**: CORS, cookie-parser

## Prerequisites

-   Node.js (v18 or higher)
-   MongoDB (local instance or a cloud service like MongoDB Atlas)
-   Cloudinary Account (for `api_key`, `api_secret`, and `cloud_name`)

## Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/shyam8182/youtube-clone.git
    cd youtube-clone
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file** in the root directory of the project and add the following environment variables:

    ```env
    PORT=8000
    MONGO_URI=your_mongodb_connection_string
    CORS_ORIGIN=*

    ACCESS_TOKEN_SECRET=your_access_token_secret
    ACCESS_TOKEN_EXPIRY=1d
    REFRESH_TOKEN_SECRET=your_refresh_token_secret
    REFRESH_TOKEN_EXPIRY=10d

    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRAE=your_cloudinary_api_secret
    ```

## Running the Application

To run the server in development mode with automatic reloading, use the following command:

```bash
npm run dev
```

The server will start on the port specified in your `.env` file (default is `http://localhost:8000`).

## API Endpoints

The following are the primary user-related endpoints available:

| Method | Endpoint              | Description                                                                          | Authentication |
| :----- | :-------------------- | :----------------------------------------------------------------------------------- | :------------- |
| `POST` | `/user/register`      | Register a new user. Expects `multipart/form-data` with user details and avatar file. | None           |
| `POST` | `/user/login`         | Log in a user with email/username and password.                                      | None           |
| `POST` | `/user/logout`        | Log out the currently authenticated user and clear their refresh token.                | Required       |
| `POST` | `/user/refresh-token` | Generate a new access token using a valid refresh token.                             | None           |

## Project Structure

The project follows a modular structure to keep the code organized and scalable.

```
/
├── public/
│   └── temp/               # Temporary storage for file uploads
├── src/
│   ├── controllers/        # Request/response logic (business logic)
│   ├── db/                 # Database connection setup
│   ├── middlewares/        # Express middlewares (e.g., auth, multer)
│   ├── models/             # Mongoose data models/schemas
│   ├── routes/             # API route definitions
│   ├── utils/              # Utility functions and classes
│   ├── app.js              # Express application setup
│   ├── constanst.js        # Project constants
│   └── index.js            # Main application entry point
├── .env                    # Environment variables (create this file)
├── package.json
└── Readme.md
