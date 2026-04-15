// Detect if running locally or in production
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://wearify-55y3.onrender.com"
    : "http://localhost:4000";

export default BASE_URL;


export function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}