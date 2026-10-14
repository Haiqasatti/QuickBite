# 🍔 QuickBite — Full-Stack Food Ordering Platform

QuickBite is a modern full-stack food ordering web application designed to provide a smooth and convenient online food ordering experience. It features a responsive React frontend, a TypeScript-powered Express backend, MongoDB data storage, secure authentication, and administrative tools for managing food categories, menu items, and orders.

The project demonstrates full-stack development skills, REST API integration, database management, authentication, authorization, and responsive user interface design.

## ✨ Features

### 👤 Authentication & User Management
- User registration and login
- JWT-based authentication
- Protected routes and access control
- Role-based authorization for administrative features

### 🍽️ Food & Category Management
- Browse food categories and menu items
- View individual food details
- Create, update, and delete food items through the admin interface
- Manage food categories
- Support for food and category images

### 🛒 Ordering Experience
- Add food items to the shopping cart
- Review cart items and quantities
- Proceed through checkout
- Access personal order information

### 🛠️ Admin Dashboard
- Manage food items and categories
- Access administrative order management
- Restrict management operations to authorized administrators

### 🎨 User Interface
- Responsive React interface
- Reusable components and organized page layouts
- Client-side routing
- Form validation and user feedback
- Consistent QuickBite branding

## 🧰 Technology Stack

**Frontend**
- React
- TypeScript
- Vite
- React Router
- CSS

**Backend**
- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- Zod

## 📁 Project Structure

```text
QuickBite/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── App.tsx
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── src/
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

*Note: The directory tree is illustrative; update it if your actual folder structure differs.*

## ⚙️ Getting Started

### Prerequisites

Make sure you have installed:

- Node.js and npm
- MongoDB or a MongoDB Atlas database
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd QuickBite
```

### 2. Configure the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder and configure the required environment variables according to the backend configuration. These typically include the MongoDB connection string, JWT secret, and server port.

Never commit real credentials or secrets to GitHub.

Start the backend:

```bash
npm run dev
```

The development server runs at `http://localhost:5000` when configured with the default local port.

### 3. Configure the Frontend

Open a separate terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend folder with the appropriate API configuration:

```env
VITE_API_URL=http://localhost:5000/api
VITE_CURRENCY=PKR
```

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

### 4. Build for Production

Frontend:

```bash
npm run build
```

Backend:

```bash
npm run build
```

Run each command from its respective folder. Ensure that the backend's environment variable names match those used by the application before deployment.

## 🔐 Security

- Environment files are excluded from Git using `.gitignore`.
- Authentication uses JWT.
- Passwords are handled using bcryptjs.
- Administrative operations use role-based access control.
- Input validation is implemented with Zod.

Production deployment should use secure environment variables, appropriate CORS configuration, and HTTPS.

## 🚀 Deployment

The frontend is intended for deployment on Vercel. The Express backend requires a compatible backend hosting service and a production MongoDB connection.

For production, configure `VITE_API_URL` to point to the deployed backend API rather than a localhost address.

**Live Demo:** Coming soon  
**GitHub Repository:** YOUR_GITHUB_REPOSITORY_URL

## 🎯 Project Goals

QuickBite was developed to strengthen practical full-stack engineering skills, including frontend development, RESTful APIs, TypeScript, authentication, database integration, application security, and deployment.

## 👩‍💻 Author

Developed as a full-stack portfolio project, showcasing modern web development practices with React, TypeScript, Express, and MongoDB.

