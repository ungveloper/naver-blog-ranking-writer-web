import { execFile } from "node:child_process";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const MAX_BUFFER = 32 * 1024 * 1024;
const BROWSER_TIMEOUT_MS = 25_000;

const MAC_BROWSER_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
];

const WINDOWS_BROWSER_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
];

const LINUX_BROWSER_NAMES = [
  "google-chrome",
  "google-chrome-stable",
  "chromium",
  "chromium-browser",
  "brave-browser",
];

export type BrowserCaptureDevice =
  | "MOBILE"
  | "DESKTOP";

export type BrowserCaptureResult = {
  html: string;
  executable: string;
};

function fileExists(path: string) {
  return access(path)
    .then(() => true)
    .catch(() => false);
}

function which(command: string) {
  return new Promise<string | null>((resolve) => {
    execFile(
      "which",
      [command],
      {
        timeout: 3_000,
        encoding: "utf8",
      },
      (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }

        const value = stdout.trim();
        resolve(value || null);
      },
    );
  });
}

async function findBrowserExecutable() {
  const configured =
    process.env.NAVER_BROWSER_EXECUTABLE?.trim();

  if (configured) {
    if (await fileExists(configured)) {
      return configured;
    }

    throw new Error(
      `NAVER_BROWSER_EXECUTABLE 경로를 찾을 수 없습니다: ${configured}`,
    );
  }

  const knownPaths =
    process.platform === "darwin"
      ? MAC_BROWSER_PATHS
      : process.platform === "win32"
        ? WINDOWS_BROWSER_PATHS
        : [];

  for (const path of knownPaths) {
    if (await fileExists(path)) {
      return path;
    }
  }

  if (process.platform !== "win32") {
    for (const name of LINUX_BROWSER_NAMES) {
      const path = await which(name);

      if (path) {
        return path;
      }
    }
  }

  return null;
}

function runBrowser(
  executable: string,
  args: string[],
) {
  return new Promise<string>((resolve, reject) => {
    execFile(
      executable,
      args,
      {
        timeout: BROWSER_TIMEOUT_MS,
        maxBuffer: MAX_BUFFER,
        encoding: "utf8",
      },
      (error, stdout, stderr) => {
        if (error) {
          const details = stderr
            .trim()
            .split("\n")
            .slice(-3)
            .join(" ");

          reject(
            new Error(
              details
                ? `로컬 Chrome DOM 캡처 실패: ${details}`
                : `로컬 Chrome DOM 캡처 실패: ${error.message}`,
            ),
          );
          return;
        }

        const html = stdout.trim();

        if (!html) {
          reject(
            new Error(
              "로컬 Chrome이 검색 페이지 DOM을 반환하지 않았습니다.",
            ),
          );
          return;
        }

        resolve(html);
      },
    );
  });
}

export async function captureUrlWithLocalBrowser(
  url: string,
  device: BrowserCaptureDevice,
): Promise<BrowserCaptureResult> {
  const executable =
    await findBrowserExecutable();

  if (!executable) {
    throw new Error(
      "로컬 Chrome/Chromium을 찾지 못했습니다. macOS 기본 설치 위치에 Chrome이 있는지 확인하거나 .env.local에 NAVER_BROWSER_EXECUTABLE 경로를 지정하세요.",
    );
  }

  const profileDir = await mkdtemp(
    join(tmpdir(), "naver-serp-browser-"),
  );

  const mobile = device === "MOBILE";
  const userAgent = mobile
    ? "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36"
    : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-sync",
    "--metrics-recording-only",
    "--mute-audio",
    "--hide-scrollbars",
    `--user-data-dir=${profileDir}`,
    `--user-agent=${userAgent}`,
    mobile
      ? "--window-size=412,915"
      : "--window-size=1440,1100",
    "--virtual-time-budget=6000",
    "--dump-dom",
    url,
  ];

  try {
    return {
      html: await runBrowser(
        executable,
        args,
      ),
      executable,
    };
  } finally {
    await rm(profileDir, {
      recursive: true,
      force: true,
    }).catch(() => undefined);
  }
}
