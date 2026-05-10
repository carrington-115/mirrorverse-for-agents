# Mirrorverse Backend

Backend service for the Mirrorverse application, built with Node.js, Express, and TypeScript.

## 🚀 Features

- **Authentication**: User registration and login
- **API**: RESTful API for application data
- **Database**: MongoDB integration
- **Security**: JWT-based authentication, password hashing

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **Validation**: Joi
- **Environment**: dotenv

## 📂 Project Structure

```
src/
├── api/
│   ├── v1/
│   │   ├── routes/      # API route definitions
│   │   ├── controllers/ # Request handlers
│   │   ├── middlewares/ # Custom middleware
│   │   └── validators/  # Request validation schemas
│   └── index.ts         # API router
├── config/              # Configuration files
├── models/              # Mongoose models
├── services/            # Business logic
├── utils/               # Utility functions
└── server.ts            # Application entry point
```

## 📦 Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd mirrorverse-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mirrorverse
JWT_SECRET=your_jwt_secret
```

## 🏃 Running the Server

Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:5000`.

## 🧪 Testing

Run the test suite:

```bash
npm test
```

## 📝 API Documentation

### Authentication

#### Register

```http
POST /api/v1/auth/register
```

**Request Body:**

```json
{
  "username": "testuser",
  "email": "[EMAIL_ADDRESS]",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "...",
    "username": "testuser",
    "email": "[EMAIL_ADDRESS]"
  }
}
```

#### Login

```http
POST /api/v1/auth/login
```

**Request Body:**

```json
{
  "email": "[EMAIL_ADDRESS]",
  "password": "password123"
}
```

**Response:**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "username": "testuser",
    "email": "[EMAIL_ADDRESS]"
  }
}
```

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
