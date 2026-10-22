import { Badge, type Tone } from "./badge";
import { bookingStatusLabels } from "@/config/site";
import type { BookingStatus } from "@/db/schema";

const tones: Record<BookingStatus, Tone> = { pending: "warn", negotiating: "brand", accepted: "palm", rejected: "rose", cancelled: "neutral" };

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={tones[status]}>{bookingStatusLabels[status]}</Badge>;
}
