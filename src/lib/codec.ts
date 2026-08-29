export function encodePayload(obj: any): string {
  try {
    const jsonStr = JSON.stringify(obj);
    return btoa(encodeURIComponent(jsonStr));
  } catch {
    return '';
  }
}

export function decodePayload(str: string): any | null {
  if (!str) return null;
  try {
    const decodedUri = decodeURIComponent(atob(str));
    return JSON.parse(decodedUri);
  } catch {
    return null;
  }
}
