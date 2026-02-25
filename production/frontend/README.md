# Frontend - Khmer Data Annotation Tool

## Overview

This is the frontend component of the Khmer Data Annotation Tool, built with **React 19** and **Vite** for fast development and optimal performance. The application provides a modern, responsive user interface for data annotation workflows.

## 🚀 Quick Start

The frontend is already configured and ready to use. **No additional setup required** for React or Tailwind CSS.

```bash
# Install dependencies
npm install

# Start development server
npm run dev

```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── navigations/         # Navigation components
├── pages/              # Application pages
├── assets/             # Static assets
├── App.jsx             # Main application component
├── main.jsx            # Application entry point
└── index.css           # Global styles with Tailwind
```

### Folder Conventions

#### `components/`

Store **reusable UI components** that can be used across multiple pages:

- Buttons (`Button.jsx`)
- Cards (`Card.jsx`)
- Modals (`Modal.jsx`)
- Form inputs (`Input.jsx`, `Select.jsx`)
- Data display components (`Table.jsx`, `List.jsx`)

```jsx
// Example: components/Button.jsx
export const Button = ({ children, variant = "primary", ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded ${
        variant === "primary" ? "bg-blue-500 text-white" : "bg-gray-200"
      }`}
      {...props}
    >
      {children}
    </button>
  );
};
```

#### `navigations/`

Store **navigation components** that appear across multiple pages:

- Main navigation bar (`Navbar.jsx`)
- Sidebar navigation (`Sidebar.jsx`)
- Breadcrumbs (`Breadcrumb.jsx`)
- Tab navigation (`TabNav.jsx`)

Common navigation items:

- **Home** - Dashboard/landing page
- **Upload** - Data upload interface
- **Result** - Annotation results view
- **Settings** - Application configuration

```jsx
// Example: navigations/Navbar.jsx
export const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <ul className="flex space-x-6 py-4">
          <li>
            <a href="/" className="text-blue-600 hover:text-blue-800">
              Home
            </a>
          </li>
          <li>
            <a href="/upload" className="text-gray-600 hover:text-gray-800">
              Upload
            </a>
          </li>
          <li>
            <a href="/result" className="text-gray-600 hover:text-gray-800">
              Result
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
};
```

#### `pages/`

Store **complete page components** representing different routes/views:

- `HomePage.jsx` - Main dashboard
- `UploadPage.jsx` - Data upload interface
- `ResultPage.jsx` - Results and analytics
- `SettingsPage.jsx` - Configuration page

```jsx
// Example: pages/HomePage.jsx
import { Navbar } from "../navigations/Navbar";
import { Button } from "../components/Button";

export const HomePage = () => {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Welcome to Khmer Data Annotation Tool
        </h1>
        <Button>Get Started</Button>
      </main>
    </div>
  );
};
```
```punleu.js
nvm install 20
nvm use 20
npm install -D @tailwindcss/vite
rm -rf node_modules package-lock.json .vite-temp
npm install
npm run dev

# will be removed after everything is finish
```

**Ready to start building?** The frontend is fully configured - just run `npm run dev` and start creating amazing user interfaces! 🚀
