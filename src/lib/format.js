const kesFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Nairobi",
});

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  dateStyle: "medium",
  timeZone: "Africa/Nairobi",
});

export function formatKES(amount) {
  return kesFormatter.format(Number(amount || 0)).replace("KES", "KSh");
}

export function formatDate(value) {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "—";
  return dateTimeFormatter.format(new Date(value));
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-KE").format(Number(value || 0));
}

export function relativeTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatDate(date);
}
