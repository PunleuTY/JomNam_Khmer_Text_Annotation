# Enhanced Reusable Table Component

A comprehensive React + Tailwind CSS table component with Create Project workflow functionality.

## Features

### ✅ **Core Table Features**

- **Data Display**: Accepts `data` prop with backend objects
- **Image Column**: Displays images with fallback for invalid URLs
- **Title Column**: Shows project/item titles
- **Description Column**: Truncates long descriptions with "More" button
- **Last Edit Column**: Formatted date/time display
- **Action Buttons**: Edit and Delete with placeholder API calls

### ✅ **New Create Project Workflow**

- **Create Button**: Right-aligned button below the table
- **Create Modal**: Form with Title and Description inputs
- **API Integration**: Placeholder POST request to backend
- **Navigation**: Redirects to `/create-project` page after success

## Usage

```jsx
import ReusableTable from "./components/ui/table";

const MyComponent = () => {
  const backendData = [
    {
      id: 1,
      image: "https://example.com/image.jpg",
      title: "My Project",
      description: "Project description here...",
      lastEdit: "2025-08-30T10:30:00Z",
    },
    // ... more data
  ];

  return <ReusableTable data={backendData} />;
};
```

## Data Structure

Each data object should have:

- `id`: Unique identifier
- `image`: Image URL (string)
- `title`: Project/item title (string)
- `description`: Description text (string)
- `lastEdit`: Date/time string or Date object

## API Endpoints

Update these placeholder URLs in the component:

### Edit Project

```javascript
// In handleEdit function
const response = await fetch(`/api/items/${item.id}`, {
  method: "PUT",
  // ... rest of the request
});
```

### Delete Project

```javascript
// In handleDelete function
const response = await fetch(`/api/items/${item.id}`, {
  method: "DELETE",
});
```

### Create Project

```javascript
// In handleCreateProject function
const response = await fetch("/api/projects", {
  method: "POST",
  // ... rest of the request
});
```

## Router Setup

The component uses React Router for navigation. Ensure your app is wrapped with a Router:

```jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<YourTablePage />} />
      <Route path="/create-project" element={<CreateProjectPage />} />
    </Routes>
  </Router>
);
```

## Customization

### Styling

- All styles use Tailwind CSS classes
- Easily customizable colors, spacing, and layout
- Responsive design included

### Modal Behavior

- Description modal shows full text with scrolling
- Create Project modal with form validation
- Both modals close on overlay click or X button

### Button Actions

- Edit: Logs item data and makes PUT request
- Delete: Shows confirmation dialog then makes DELETE request
- Create: Validates form, makes POST request, then navigates

## Dependencies

- React
- React Router DOM
- Tailwind CSS
- React Icons (for edit/delete icons)

## Files

- `table.jsx` - Main reusable component
- `TableExample.jsx` - Complete usage example with routing
- `README.md` - This documentation
