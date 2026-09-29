export type AppointmentStatus = "pending" | "completed" | "cancelled";

export type AppointmentType =
  | "consultation"
  | "measurement"
  | "fitting"
  | "delivery"
  | "alteration";

export type Appointment = {
  id: string;
  clientName: string;
  clientPhone: string;
  clientId?: string;
  date: string;
  // time: string;
  service: AppointmentType;
  purpose: AppointmentType;
  status: AppointmentStatus;
  notes: string;
  duration: number;
  userEmail: string;
  createdAt: string;
  updatedAt: string;

  calendarEventId?: string;
};
