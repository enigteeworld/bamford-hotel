export function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildRoomsUrl(params: {
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
}) {
  const q = new URLSearchParams({
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    rooms: String(params.rooms),
    adults: String(params.adults),
    children: String(params.children),
  });
  return `/rooms?${q.toString()}`;
}
