import { ApiResponse, LoanStatus } from "./../types/index";
import axios from "axios";
import type {
  Member,
  Loan,
  ContributionPeriod,
  DashboardSummary,
  MemberRequest,
  LoanRequest,
  VoteDecision,
  FineDto,
  FineRequest,
  FineStatus,
  FineType,
  FineTypeRequest,
  ExtraDto,
  AccountAdjustment,
  BillDto,
} from "../types";
import { API_URL } from "../config/constant";

export const api = axios.create({
  baseURL: `${API_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Refresh handling state
// let isRefreshing = false;
// let failedQueue: Deferred<string>[] = [];

// const processQueue = (error: unknown | null, token: string | null = null) => {
//   failedQueue.forEach((deferred) => {
//     if (error) {
//       deferred.reject(error);
//     } else if (token) {
//       deferred.resolve(token);
//     }
//   });
//   failedQueue = [];
// };

// =======================
// REQUEST INTERCEPTOR
// =======================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const chamaId = localStorage.getItem("activeChamaId");
  if (chamaId) {
    config.headers["X-Chama-Id"] = chamaId;
  }
  return config;
});

// =======================
// RESPONSE INTERCEPTOR
// =======================
// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           failedQueue.push({ resolve, reject });
//         })
//           .then((token) => {
//             originalRequest.headers.Authorization = `Bearer ${token}`;
//             return api(originalRequest);
//           })
//           .catch((err) => Promise.reject(err));
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         const newToken = await refreshAccessToken();
//         if (newToken) {
//           processQueue(null, newToken);
//           originalRequest.headers.Authorization = `Bearer ${newToken}`;
//           return api(originalRequest);
//         }
//       } catch (refreshError) {
//         processQueue(refreshError, null);
//         clearAuthData();
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend returns 401 or the JWT exception causes a failure
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.error("Session expired. Redirecting to login...");
      localStorage.clear();
      window.location.href = "/login"; // Force redirect
    }
    return Promise.reject(error);
  },
);

export const dashboardApi = {
  getSummary: (memberId: number) =>
    api.get<DashboardSummary>("/dashboard/summary", { params: { memberId } }),
};

export const contributionApi = {
  getMemberSurplus: (memberId: number) =>
    api.get<number>(`/contribution/surplus/${memberId}`),
};

export interface BillDto {
  id: number;
  memberId: number;
  memberName: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  settledAt: string | null;
}

export interface BillGroupDto {
  dueDate: string;
  totalTarget: number;
  collected: number;
  bills: BillDto[];
}

export interface PlanSummaryDto {
  planId: number;
  planName: string;
  billGroups: BillGroupDto[];
}

export const periodsApi = {
  getWithContributions: (page: number = 0, size: number = 10) =>
    api
      .get<PlanSummaryDto[]>("/chama/contributions/summary", { params: { page, size } })
      .then((res) => res.data),
  create: (data: { date: string }) =>
    api.post("/contribution-period", data).then((res) => res.data),
};

export const membersApi = {
  getAll: () => api.get<Member[]>("/member").then((res) => res.data),
  create: (data: MemberRequest) => api.post("/member/create", data),
  update: (id: number, data: MemberRequest) => api.put(`/member/${id}`, data),
  delete: (id: number) => api.delete(`/member/${id}`).then((res) => res.data),
};

export const contributionsApi = {
  initiateStk: async (periodId: number, memberId: number, phone?: string, amountToPay?: number) => {
    const params = new URLSearchParams({
      periodId: String(periodId),
      memberId: String(memberId),
    });
    if (phone) params.append("phone", phone);
    if (amountToPay) params.append("amountToPay", String(amountToPay));
    const res = await api.post(`/contribution?${params.toString()}`);
    return res.data;
  },

  checkStatus: async (checkoutRequestId: string) => {
    const res = await api.get(`/transaction-status/${checkoutRequestId}`);
    return res.data; // Should return { status: "COMPLETED" | "PENDING" | "FAILED" }
  },

  triggerLifecycle: async () => {
    const res = await api.post("/chama/contributions/trigger-lifecycle");
    return res.data;
  },
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
      },
    ),
  disburse: (loanId: number) =>
    api.post("/loan/disburse", {}, { params: { loanId } }),
  postRepayment: async (loanId: number, amount: number, phone?: string) => {
    const params = new URLSearchParams({
      loanId: String(loanId),
      amount: String(amount),
    });
    if (phone) params.append("phone", phone);
    const res = await api.post(`/loan/repay?${params.toString()}`);
    return res.data;
  },
  getLoanRepayments: (loanId: number) =>
    api.get(`/loan/${loanId}/repayments`).then((res) => res.data),
};

export const finesApi = {
  getAll: (status: FineStatus, page: number = 0, size: number = 100) =>
    api.get<any>("/chama/fines/page", { params: { status, page, size } }).then((res) => res.data.content),
  getTypes: () => api.get<any[]>("/chama/fines/rules").then((res) => res.data),
  record: (data: any) => {
    return api.post("/chama/fines/manual", {
      memberId: data.memberId,
      amount: data.amount || 0, // Fallback if amount isn't in FineRequest
      narrative: "Manual fine",
      reference: `MANUAL-${Date.now()}`
    });
  },
  createType: (data: any) => {
    return api.post("/chama/fines/rules", {
      name: data.name,
      description: data.description,
      amount: data.amount,
      percentage: data.percentage,
      calculation: data.percentage > 0 ? "PERCENTAGE" : "FIXED",
      trigger: "MANUAL",
      active: true,
      autoApply: true
    });
  },
  settle: async (fineId: number, phone?: string) => {
    const params = new URLSearchParams({
      fineId: String(fineId),
    });
    if (phone) params.append("phone", phone);
    const res = await api.post(`/chama/fines/settle?${params.toString()}`);
    return res.data;
  },
  waive: (fineId: number, reason: string = "Waived by officer") => api.patch(`/chama/fines/${fineId}/waive`, { reason }),
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
  getAll: (type: "DEBIT" | "CREDIT") =>
    api
      .get<AccountAdjustment[]>(`/account-adjustment?type=${type}`)
      .then((res) => res.data),
  create: (data: AccountAdjustment) => api.post("/account-adjustment", data),
};

export const arrearsApi = {
  getArrears: (page = 0, size = 10, search?: string) =>
    api
      .get<ApiResponse<BillDto[]>>(`/contribution/arrears`, {
        params: { page, size, ...(search ? { search } : {}) },
      })
      .then((res) => res.data),
  payNow: (arrearId: number, phone?: string) =>
    api
      .post(`/contribution/arrears/${arrearId}/pay`, null, {
        params: phone ? { phone } : {},
      })
      .then((res) => res.data),
};

export interface CashFlowRow {
  id: number;
  date: string;
  direction: "IN" | "OUT" | "FEE";
  amount: number;
  category?: string;
  description?: string;
  memo?: string;
  memberId?: number;
  reference?: string;
  account?: string;
}

export interface CashFlowTrendPoint {
  label: string;
  moneyIn: number;
  moneyOut: number;
  net: number;
}

export interface CashFlowSummary {
  moneyIn: number;
  moneyOut: number;
  transactionFees: number;
  balance: number;
  trend: CashFlowTrendPoint[];
}

export const cashFlowApi = {
  movements: (page = 0, size = 15, direction: "ALL" | "IN" | "OUT" | "FEE" = "ALL") =>
    api
      .get<{ content: CashFlowRow[]; totalPages: number; totalElements: number; number: number }>(
        "/chama/cashflow",
        { params: { page, size, direction } },
      )
      .then((res) => res.data),
  summary: (months = 6) =>
    api.get<CashFlowSummary>("/chama/cashflow/summary", { params: { months } }).then((r) => r.data),
  record: (payload: {
    direction: "IN" | "OUT" | "FEE";
    amount: number;
    transactionFee?: number;
    description?: string;
    date?: string;
    reference?: string;
  }) => api.post("/chama/cashflow", payload),
};

export interface DashboardAnalytics {
  liquidBalance: number;
  moneyIn: number;
  moneyOut: number;
  transactionFees: number;
  totalSavings: number;
  outstandingLoans: number;
  unpaidFines: number;
  activeMembers: number;
  activeLoans: number;
  cashFlowTrend: CashFlowTrendPoint[];
  equityDistribution: { memberId: number; memberName: string; equityPercentage: number; shareValue: number }[];
  loansDisbursed: number;
  loansRepaid: number;
  recoveryRate: number;
}

export const analyticsApi = {
  get: (months = 6) =>
    api.get<DashboardAnalytics>("/dashboard/analytics", { params: { months } }).then((r) => r.data),
};

export const b2cTransfersApi = {
  getAll: () => api.get<import("../types").B2cTransferDto[]>("/b2c-transfers").then((res) => res.data),
  initiate: (amount: number, recipientPhone: string, reason: string, pin: string, memberId: number) => {
    const params = new URLSearchParams({
      amount: String(amount),
      recipientPhone,
      reason,
      pin,
      memberId: String(memberId),
    });
    return api.post(`/b2c-transfers/initiate?${params.toString()}`).then((res) => res.data);
  },
  authorize: (requestId: number, memberId: number, approve: boolean) => {
    const params = new URLSearchParams({
      memberId: String(memberId),
      approve: String(approve),
    });
    return api.post(`/b2c-transfers/${requestId}/authorize?${params.toString()}`).then((res) => res.data);
  },
};

export const ledgerApi = {
  getAccounts: async () => {
    const res = await api.get<import("../types").LedgerAccountDto[]>("/ledger");
    return res.data;
  },
};

export const transactionsApi = {
  getAll: (page = 0, size = 15, search?: string) =>
    api
      .get("/transactions", {
        params: { page, size, ...(search ? { search } : {}) },
      })
      .then((res) => res.data),
};
