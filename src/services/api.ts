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
} from "../types";
import { API_URL } from "../config/constant";

const api = axios.create({
  baseURL: `${API_URL}`,
  headers: {
    "Content-Type": "application/json",
  },
});

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>("/dashboard/summary"),
};

// export const periodsApi = {
//   getWithContributions: () =>
//     api
//       .get<ContributionPeriod[]>("/contribution-period")
//       .then((res) => res.data),
//   create: (data: { date: string }) =>
//     api.post("/contribution-period", data).then((res) => res.data),
// };

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
    api.post(`/loans/${loanId}/repay`, { amount }),
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
