export function generateId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${time}${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
