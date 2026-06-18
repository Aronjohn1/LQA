import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function formatTitle(pathname) {
  if (pathname === "/" || pathname === "/login") return "Login";

  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "Dashboard";

  return last
    .replace(/([a-z])([A-Z])/g, "$1 $2") 
    .replace(/[-_]/g, " ")              
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function PageTitle() {
  const location = useLocation();

  useEffect(() => {
    document.title = `${formatTitle(location.pathname)} - LQA System`;
  }, [location.pathname]);

  return null;
}
