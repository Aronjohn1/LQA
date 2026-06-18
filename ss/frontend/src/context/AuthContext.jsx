import React, { createContext, useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

const storageKeys = [
  "token", "role", "category", "name", "id", "user_id",
  "c_id", "s_id", "j_id", "e_id", "t_id", "i_id", "ls_id",
  "c_name", "s_name", "j_name", "e_name", "t_name", "i_name", "ls_name", "user_name",
  "profileImage"
];

function readStoredUser() {
  const id =
    localStorage.getItem("user_id") ||
    localStorage.getItem("id") ||
    localStorage.getItem("c_id") ||
    localStorage.getItem("s_id") ||
    localStorage.getItem("j_id") ||
    localStorage.getItem("e_id") ||
    localStorage.getItem("t_id") ||
    localStorage.getItem("i_id") ||
    localStorage.getItem("ls_id");

  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    category: localStorage.getItem("category"),
    name: localStorage.getItem("name"),
    id,
    user_id: localStorage.getItem("user_id"),
    c_id: localStorage.getItem("c_id"),
    s_id: localStorage.getItem("s_id"),
    j_id: localStorage.getItem("j_id"),
    e_id: localStorage.getItem("e_id"),
    t_id: localStorage.getItem("t_id"),
    i_id: localStorage.getItem("i_id"),
    ls_id: localStorage.getItem("ls_id"),
    user_name: localStorage.getItem("user_name")
  };
}

function firstValue(...values) {
  return values.find(value => value !== undefined && value !== null && value !== "");
}

function getDashboardPath(role) {
  const normalizedRole = String(role || "").toLowerCase();
  if (normalizedRole === "admin") return "/admin";
  if (normalizedRole === "librarian" || normalizedRole === "librarian staff") return "/librarian";
  return "/user";
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(readStoredUser);

  const login = (data) => {
    const source = data.user || data;
    const userId = firstValue(
      source.user_id,
      source.id,
      source.c_id,
      source.s_id,
      source.j_id,
      source.e_id,
      source.t_id,
      source.i_id,
      source.ls_id
    );
    const userName = firstValue(
      source.name,
      source.user_name,
      source.c_name,
      source.s_name,
      source.j_name,
      source.e_name,
      source.t_name,
      source.i_name,
      source.ls_name
    );
    const role = firstValue(source.role, source.category);
    const category = firstValue(source.category, source.role);

    const nextUser = {
      ...source,
      token: data.token,
      id: userId,
      name: userName,
      role,
      category
    };

    localStorage.setItem("token", data.token || "");
    localStorage.setItem("role", role || "");
    localStorage.setItem("category", category || "");
    localStorage.setItem("name", userName || "");
    localStorage.setItem("id", userId || "");

    ["user_id", "c_id", "s_id", "j_id", "e_id", "t_id", "i_id", "ls_id", "user_name", "c_name", "s_name", "j_name", "e_name", "t_name", "i_name", "ls_name"].forEach((key) => {
      if (source[key]) localStorage.setItem(key, source[key]);
    });

    setUser(nextUser);
    navigate(getDashboardPath(role), { replace: true });
  };

  const logout = () => {
    storageKeys.forEach(key => localStorage.removeItem(key));
    setUser({
      token: null,
      role: null,
      category: null,
      name: null,
      id: null,
      user_id: null
    });
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
