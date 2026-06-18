import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./Login";
import UserLayout from "./views/user/UserLayout";
import AdminLayout from "./views/admin/AdminLayout";
import LibrarianLayout from "./views/librarian/LibrarianLayout";
import PageTitle from "./PageTitle";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageTitle />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/user/*" element={<UserLayout />} />
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="/librarian/*" element={<LibrarianLayout />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
