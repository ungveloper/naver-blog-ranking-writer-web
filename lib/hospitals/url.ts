export function normalizeOptionalUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).toString();
  } catch {
    return trimmed;
  }
}

function decodeRepeatedly(value: string, max = 4) {
  let current = value;

  for (let index = 0; index < max; index += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }

  return current;
}

function cutDuplicatedUrl(value: string) {
  const firstHttp = value.indexOf("http");
  if (firstHttp < 0) return value;

  const secondHttp = value.indexOf("http", firstHttp + 4);
  return secondHttp > 0 ? value.slice(0, secondHttp) : value;
}

export function normalizeNaverBookingUrl(
  value: string | null | undefined,
) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const deduped = cutDuplicatedUrl(trimmed);

  try {
    const parsed = new URL(deduped);

    if (parsed.hostname === "map.naver.com") {
      const placePath = parsed.searchParams.get("placePath");

      if (placePath) {
        const queryStart = placePath.indexOf("?");

        if (queryStart >= 0) {
          const innerParams = new URLSearchParams(
            placePath.slice(queryStart + 1),
          );
          const bookingRedirectUrl =
            innerParams.get("bookingRedirectUrl");

          if (bookingRedirectUrl) {
            const decoded = decodeRepeatedly(bookingRedirectUrl);

            try {
              return new URL(decoded).toString();
            } catch {
              return decoded;
            }
          }
        }
      }
    }

    return parsed.toString();
  } catch {
    return deduped;
  }
}
