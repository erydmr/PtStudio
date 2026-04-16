export interface TokenResponse {
  token: string;
  expiration: string;
  fullName: string;
  role: string;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthUser {
  fullName: string;
  role: string;
  token: string;
}

export interface Trainer {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  specialization?: string;
  color?: string;
  isActive: boolean;
}

export interface Client {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  notes?: string;
  emergencyContact?: string;
  isActive: boolean;
}

export interface Package {
  id: number;
  name: string;
  sessionCount: number;
  defaultDurationMinutes: number;
  maxDays?: number;
  price: number;
  isActive: boolean;
}

export interface ClientPackage {
  id: number;
  clientId: number;
  clientFullName: string;
  packageId: number;
  packageName: string;
  remainingSessions: number;
  purchaseDate: string;
  expiryDate?: string;
  status: string;
}

export interface Appointment {
  id: number;
  trainerId: number;
  trainerFullName: string;
  trainerColor?: string;
  startTime: string;
  endTime: string;
  capacity: number;
  isGroup: boolean;
  status: string;
  notes?: string;
  recurrenceGroupId?: string;
  clients: AppointmentClientItem[];
}

export interface AppointmentClientItem {
  id: number;
  clientId: number;
  clientFullName: string;
  clientPackageId: number;
  status: string;
}

export interface CheckInResponse {
  attendanceId: number;
  clientFullName: string;
  trainerFullName: string;
  startTime: string;
  endTime: string;
  method: string;
}

export interface CreditAdjustment {
  id: number;
  clientPackageId: number;
  clientFullName: string;
  packageName: string;
  amount: number;
  reason: string;
  adjustedByFullName: string;
  createdAt: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export interface Dashboard {
  todayLessonCount: number;
  todayCompletedCount: number;
  todayBurnedCount: number;
  activeClientCount: number;
  activeTrainerCount: number;
  activePackageCount: number;
  monthlyRevenue: number;
  previousMonthRevenue: number;
  monthlyNewClientCount: number;
  monthlyCancelledCount: number;
  monthlyBurnedCount: number;
  monthlyCompletedCount: number;
  cancellationRate: number;
  upcomingLessons: UpcomingLesson[];
}

export interface UpcomingLesson {
  appointmentId: number;
  trainerFullName: string;
  trainerColor?: string;
  startTime: string;
  endTime: string;
  clientCount: number;
  capacity: number;
  isGroup: boolean;
}

export interface TrainerReport {
  trainerId: number;
  trainerFullName: string;
  color?: string;
  totalLessons: number;
  completedLessons: number;
  cancelledLessons: number;
  burnedLessons: number;
  uniqueClientCount: number;
  completionRate: number;
}

export interface ClientReport {
  clientId: number;
  clientFullName: string;
  totalLessons: number;
  completedLessons: number;
  cancelledLessons: number;
  burnedLessons: number;
  totalRemainingSessions: number;
  activePackageCount: number;
}

export interface RevenueReport {
  year: number;
  month: number;
  monthName: string;
  revenue: number;
  packagesSold: number;
}

export interface CancellationReport {
  year: number;
  month: number;
  monthName: string;
  totalLessons: number;
  completedLessons: number;
  cancelledLessons: number;
  burnedLessons: number;
  cancellationRate: number;
  burnRate: number;
}
