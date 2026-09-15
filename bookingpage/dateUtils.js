// Date / slot / ICS helpers (plain globals, ES6+ syntax)

function getDaysInMonth(year, monthIndex) {
  const date = new Date(year, monthIndex, 1);
  const days = [];
  while (date.getMonth() === monthIndex) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function formatDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function generateTimeSlots(durationMinutes = 30) {
  const slots = [];
  const startHour = 9; // 9:00 AM
  const endHour = 17; // 5:00 PM

  let totalMinutes = startHour * 60;
  const maxMinutes = endHour * 60;

  while (totalMinutes < maxMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    slots.push(timeStr);
    totalMinutes += durationMinutes;
  }

  return slots;
}

function format12Hour(time24) {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getSlotStatus(providerId, dateStr, timeSlot, appointments, holds, currentClientId) {
  // Check if booked
  const isBooked = appointments.some(
    (a) => a.providerId === providerId && a.date === dateStr && a.timeSlot === timeSlot && a.status === 'confirmed'
  );
  if (isBooked) return 'booked';

  // Check if held
  const holdKey = `${providerId}:${dateStr}:${timeSlot}`;
  const activeHold = holds.find((h) => h.id === holdKey && h.expiresAt > Date.now());

  if (activeHold) {
    if (activeHold.holderClientId === currentClientId) {
      return 'held_by_me';
    } else {
      return 'held_by_other';
    }
  }

  return 'available';
}

function generateICSFile(apt, providerName, serviceName) {
  const dateParts = apt.date.split('-');
  const timeParts = apt.timeSlot.split(':');

  const start = new Date(
    parseInt(dateParts[0], 10),
    parseInt(dateParts[1], 10) - 1,
    parseInt(dateParts[2], 10),
    parseInt(timeParts[0], 10),
    parseInt(timeParts[1], 10)
  );

  const end = new Date(start.getTime() + (apt.durationMinutes || 30) * 60 * 1000);

  const formatICSDate = (d) => {
    return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BookAppointment//Appointment Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `SUMMARY:${serviceName} with ${providerName}`,
    `DESCRIPTION:Appointment confirmed for ${apt.clientName}.\\nMeeting Link: ${apt.meetingUrl}`,
    `LOCATION:${apt.meetingUrl}`,
    `DTSTART:${formatICSDate(start)}`,
    `DTEND:${formatICSDate(end)}`,
    `STATUS:CONFIRMED`,
    `ORGANIZER;CN=${providerName}:mailto:noreply@booking.app`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN=${apt.clientName}:mailto:${apt.clientEmail}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

function downloadICS(apt, providerName, serviceName) {
  const icsText = generateICSFile(apt, providerName, serviceName);
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `appointment-${apt.date}-${apt.timeSlot.replace(':', '')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
