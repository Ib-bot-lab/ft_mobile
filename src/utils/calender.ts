import * as Calendar from "expo-calendar";
import { Platform } from "react-native";
import { Appointment } from "../types/appointment";
import { ShowToastMessage } from "./random";

// Get or request calendar permission & return editable calendar
async function getDefaultCalendarId(): Promise<string | null> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();

    if (status !== "granted") {
      ShowToastMessage({
        preset: "error",
        title: "Calendar permission not granted",
        from: "top",
      });
      return null;
    }

    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT,
    );

    const editable = calendars.find((c) => c.allowsModifications);

    if (!editable) {
      ShowToastMessage({
        preset: "error",
        title: "No editable calendar found",
        from: "top",
      });
      return null;
    }

    return editable.id;
  } catch (error) {
    console.error("Error getting default calendar:", error);
    throw error;
  }
}

export async function createCalendarEvent(
  appointment: Appointment,
): Promise<string | undefined> {
  try {
    const calendarId = await getDefaultCalendarId();
    if (!calendarId) return undefined;

    // Parse ISO string date (e.g., "2026-02-09T19:30:29.142Z")
    const startDate = new Date(appointment.date);
    // Duration is in hours, convert to milliseconds (hours * 60 minutes * 60 seconds * 1000 ms)
    const endDate = new Date(
      startDate.getTime() + (appointment.duration || 1) * 60 * 60 * 1000,
    );

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log("Invalid dates - startDate:", appointment.date);
      ShowToastMessage({
        preset: "error",
        title: "Invalid date or time format",
        from: "top",
      });
      return undefined;
    }

    const eventId = await Calendar.createEventAsync(calendarId, {
      title: `${appointment.clientName} - ${appointment.service}`,
      startDate,
      endDate,
      notes: appointment.notes || "",
      timeZone: Platform.OS === "ios" ? undefined : "UTC",
    });

    console.log("Calendar event created:", eventId);
    ShowToastMessage({
      preset: "done",
      title: "Added to calendar",
      from: "top",
    });
    return eventId;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    ShowToastMessage({
      preset: "error",
      title: "Failed to create calendar event",
      from: "top",
    });
    return undefined;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  appointment: Appointment,
): Promise<void> {
  try {
    if (!eventId) {
      ShowToastMessage({
        preset: "error",
        title: "Event ID is required for updating",
        from: "top",
      });
      return;
    }

    // Parse ISO string date (e.g., "2026-02-09T19:30:29.142Z")
    const startDate = new Date(appointment.date);
    // Duration is in hours, convert to milliseconds
    const endDate = new Date(
      startDate.getTime() + (appointment.duration || 1) * 60 * 60 * 1000,
    );

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.log("Invalid dates - startDate:", appointment.date);
      ShowToastMessage({
        preset: "error",
        title: "Invalid date or time format",
        from: "top",
      });
      return;
    }

    await Calendar.updateEventAsync(eventId, {
      title: `${appointment.clientName} - ${appointment.service}`,
      startDate,
      endDate,
      notes: appointment.notes || "",
    });

    console.log("Calendar event updated:", eventId);
    ShowToastMessage({
      preset: "done",
      title: "Calendar updated",
      from: "top",
    });
  } catch (error) {
    console.error("Error updating calendar event:", error);
    ShowToastMessage({
      preset: "error",
      title: "Failed to update calendar event",
      from: "top",
    });
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    if (!eventId) {
      ShowToastMessage({
        preset: "error",
        title: "Event ID is required for deletion",
        from: "top",
      });
      return;
    }

    await Calendar.deleteEventAsync(eventId);
    console.log("Calendar event deleted:", eventId);
    ShowToastMessage({
      preset: "done",
      title: "Removed from calendar",
      from: "top",
    });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    ShowToastMessage({
      preset: "error",
      title: "Failed to delete calendar event",
      from: "top",
    });
  }
}

// Helper function to check if calendar permissions are granted
export async function hasCalendarPermission(): Promise<boolean> {
  try {
    const { status } = await Calendar.getCalendarPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Error checking calendar permission:", error);
    return false;
  }
}

// Helper function to get all available calendars
export async function getAvailableCalendars(): Promise<Calendar.Calendar[]> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();

    if (status !== "granted") {
      return [];
    }

    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT,
    );

    return calendars.filter((c) => c.allowsModifications);
  } catch (error) {
    console.error("Error getting available calendars:", error);
    return [];
  }
}
