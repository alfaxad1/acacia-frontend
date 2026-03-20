import { ApiResponse, LoanStatus } from "./../types/index";
import axios from "axios";
import type {
  Member,
  Loan,
  ContributionPeriod,
  DashboardSummary,
  ContributionRequest,
  MemberRequest,
  LoanRequest,
  VoteDecision,
  FineDto,
  FineRequest,
  FineStatus,
  ExtraDto,
  Deferred,
  AccountAdjustment,
  ContributionArrearDto,
} from "../types";
import { API_URL } from "../config/constant";
import { clearAuthData, refreshAccessToken } from "./auth";

export const api = axios.create({
  baseURL: `${API_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Refresh handling state
let isRefreshing = false;
let failedQueue: Deferred<string>[] = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((deferred) => {
    if (error) {
      deferred.reject(error);
    } else if (token) {
      deferred.resolve(token);
    }
  });
  failedQueue = [];
};

// =======================
// REQUEST INTERCEPTOR
// =======================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =======================
// RESPONSE INTERCEPTOR
// =======================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthData();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const dashboardApi = {
  getSummary: (memberId : number) => api.get<DashboardSummary>("/dashboard/summary",  { params: { memberId } }),
};

export const periodsApi = {
  getWithContributions: () =>
    api
      .get<ApiResponse<ContributionPeriod[]>>("/contribution-period")
      .then((res) => res.data.data),
  create: (data: { date: string }) =>
    api.post("/contribution-period", data).then((res) => res.data),
};

export const membersApi = {
  getAll: () => api.get<Member[]>("/member").then((res) => res.data),
  create: (data: MemberRequest) => api.post("/member/create", data),
};

export const contributionsApi = {
  record: (data: ContributionRequest) => api.post("/contribution", data),
};

export const loansApi = {
  getAll: (loanStatus: LoanStatus) =>
    api.get<Loan[]>("/loan", { params: { loanStatus } }),
  vote: (loanId: number, memberId: number, decision: VoteDecision) =>
    api
      .post(`/loan/${loanId}/vote`, {}, { params: { memberId, decision } })
      .then((res) => res.data),
  request: (data: LoanRequest) =>
    api.post(
      "/loan/request",
      {},
      {
        params: { memberId: data.memberId, amount: data.amount },
      }
    ),
  disburse: (loanId: number) =>
    api.post("/loan/disburse", {}, { params: { loanId } }),
  postRepayment: (loanId: string | number, amount: number) =>
    api.post(`/loan/repay`, {}, { params: { loanId, amount } }),
};

export const finesApi = {
  getAll: (status: FineStatus) =>
    api.get<FineDto[]>("/fine", { params: { status } }).then((res) => res.data),
  record: (data: FineRequest) => api.post("/fine", data),
  settle: (fineId: number) =>
    api.post("/fine/settle", {}, { params: { fineId } }),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }).then((res) => res.data),
};

export const extrasApi = {
  getExtras: (page: number, size: number, extraType: "SURPLUS" | "ARREAR") =>
    api.get<ApiResponse<ExtraDto[]>>("/extra", {
      params: { page, size, extraType },
    }),
};

export const adjustmentApi = {
  getAll: (type: 'DEBIT' | 'CREDIT') => 
    api.get<AccountAdjustment[]>(`/account-adjustment?type=${type}`).then((res) => res.data),
  create: (data: AccountAdjustment) => 
    api.post("/account-adjustment", data),
};

export const arrearsApi = {
    getArrears: () => 
        api.get<ApiResponse<ContributionArrearDto[]>>(`/contribution/arrears`)
           .then((res) => res.data),
};
