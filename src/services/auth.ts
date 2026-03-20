import axios from "axios";
import { api } from "./api";
import { API_URL } from "../config/constant";

export const refreshAccessToken = async () => {
  try {
    console.log("Starting to refresh....");
    const response = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );

    const { accessToken, expirationTime } = response.data;

    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("tokenExpiry", expirationTime);

    return accessToken;
  } catch (error) {
    console.error("Refresh token failed:", error);

    clearAuthData();
    return null;
  }
};

export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    console.error("Logout request failed", err);
  } finally {
    clearAuthData();
    window.location.href = "/login";
  }
};

export const clearAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("expirationTime");
  localStorage.removeItem("userData");
  localStorage.removeItem("memberId");
};
