export enum MemberStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum LoanStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  DISBURSED = "DISBURSED",
  REPAID = "REPAID",
  REJECTED = "REJECTED",
  DEFAULTED = "DEFAULTED",
}

export enum ExtraType {
  ARREAR = "ARREAR",
  FINE = "FINE",
  PENALTY = "PENALTY",
}

export enum ExtraStatus {
  ACTIVE = "ACTIVE",
  CLEARED = "CLEARED",
}

export enum VoteDecision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

export enum FineTyp {
  //LATE_PAYMENT = 'LATE_PAYMENT',
  LATE_MEETINGS = "LATE_MEETINGS",
  MEETING_ABSENTEEISM = "MEETING_ABSENTEEISM",
}

export enum FineStatus {
  PAID = "PAID",
  UNPAID = "UNPAID",
}

export interface DashboardSummary {
  saccoBalance: number;
  totalLoansIssued: number;
  activeLoans: number;
  membersWithArrears: number;
  weeklyComplianceRate: number;
}

export interface LoanRequest {
  memberId: number;
  amount: number;
}

export interface ContributionRequest {
  memberId: number;
  periodId: number;
  amount: number;
  paymentDate?: string;
}

export interface MemberRequest {
  id?: number;
  fullName: string;
  phone: string;
  email: string;
  joinDate: string;
  password?: string;
}

export interface Contribution {
  id: number;
  memberName: string | null;
  amount: number;
  paymentDate: string;
  late: boolean;
}

export interface ContributionPeriod {
  id: number;
  date: string;
  deadline: string;
  amountRequired: number;
  contributions: Contribution[];
}

export interface Member {
  id: number;
  memberNumber: string;
  fullName: string;
  phone: string;
  email: string;
  joinDate: string;
  status: MemberStatus;
}

export interface Period {
  id: number;
  name: string;
  expectedAmount: number;
}

export interface Loan {
  id: number;
  memberName: string;
  requestedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  dueDate: string;
  interestAmount: number;
  status: LoanStatus;
  duration: number;
  requestDate: string;
  approvedDate?: string;
  memberNo: string;
  memberId: number;
}

export interface FineDto {
  id: number;
  memberName: string;
  amount: number;
  date: string;
  status: FineStatus;
  type: FineTyp;
  paidDate: string;
}

export interface FineRequest {
  memberId: number;
  type: FineTyp;
  amount: number;
  fineDate: string;
}

export interface UserData {
  memberId: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string | null;
  expirationTime: number;
  userData: UserData;
}

