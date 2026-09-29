import { AppointmentStatus, AppointmentType } from "@/src/types/appointment";

export function generateAppointmentId(): string {
  return `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatAppointmentDateTime(date: string, time: string): string {
  const appointmentDate = new Date(date);
  return `${appointmentDate.toLocaleDateString()} at ${time}`;
}

export function getAppointmentTypeLabel(type: AppointmentType): string {
  const labels: Record<AppointmentType, string> = {
    consultation: "Consultation",
    measurement: "Measurement",
    fitting: "Fitting",
    delivery: "Delivery",
    alteration: "Alteration",
  };
  return labels[type];
}

export function getAppointmentStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    pending: "Pending",
    // confirmed: "Confirmed",
    // "in-progress": "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status];
}
