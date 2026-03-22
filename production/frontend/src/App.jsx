import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./navigations/Layout";
import Home from "./pages/Home";
import Annotate from "./pages/Annotate";
import Feature from "./pages/Feature";
import About from "./pages/About";
import Project from "./pages/Myproject";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Userprofile";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
function App() {
  return (
    <Router>
      <Routes>
        {/* All routes use the Layout component which includes the sidebar */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="Annotate" element={<ProtectedRoute><Annotate /></ProtectedRoute>} />
          <Route path="multi" element={<ProtectedRoute><Annotate /></ProtectedRoute>} />
          <Route path="Annotate/:id" element={<ProtectedRoute><Annotate /></ProtectedRoute>} />
          <Route path="feature" element={<Feature />} />
          <Route path="about" element={<About />} />
          <Route path="project" element={<ProtectedRoute><Project /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Route>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Routes>

      {/* Toast Container for react-toastify */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
}

export default App;
