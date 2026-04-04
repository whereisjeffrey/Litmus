import type { ScanResult, AIAnalysis } from "@placeholder/shared";

const API_BASE = "http://localhost:3001"; // Will be configurable later

export const apiClient = {
  async saveScan(
    scanResult: ScanResult,
    accessToken?: string
  ): Promise<{ id: string } | null> {
    // If no access token, user isn't logged in — silently skip
    if (!accessToken) return null;

    try {
      const response = await fetch(`${API_BASE}/api/scan/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          url: scanResult.url,
          pageType: scanResult.pageType,
          overallScore: scanResult.overallScore,
          viewportMode: "desktop", // TODO: get from state
          categoryScores: scanResult.categories,
          aiAnalysis: scanResult.aiAnalysis,
          findings: scanResult.allFindings,
        }),
      });

      if (!response.ok) return null;
      return response.json();
    } catch {
      // API not available — silently fail (extension works offline)
      return null;
    }
  },

  async getHistory(accessToken: string, limit = 20, offset = 0) {
    try {
      const response = await fetch(
        `${API_BASE}/api/scan/history?limit=${limit}&offset=${offset}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },

  async getScan(scanId: string, accessToken: string) {
    try {
      const response = await fetch(`${API_BASE}/api/scan/${scanId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },

  async captureScreenshot(): Promise<string | null> {
    try {
      const response = await chrome.runtime.sendMessage({ type: "CAPTURE_SCREENSHOT" });
      return response?.dataUrl || null;
    } catch {
      return null;
    }
  },

  async analyzeWithAI(scanResult: ScanResult, screenshot?: string | null): Promise<AIAnalysis | null> {
    try {
      // Also extract visible text content from the scan for qualitative analysis
      const visibleText = scanResult.allFindings
        .filter((f) => f.description)
        .map((f) => f.description)
        .join(" ")
        .substring(0, 500);

      const response = await fetch(`${API_BASE}/api/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanData: {
            overallScore: scanResult.overallScore,
            pageType: scanResult.pageType,
            categories: scanResult.categories,
            allFindings: scanResult.allFindings.map((f) => ({
              scanner: f.scanner,
              severity: f.severity,
              title: f.title,
              description: f.description,
            })),
          },
          pageType: scanResult.pageType,
          url: scanResult.url,
          screenshot: screenshot || undefined,
        }),
      });

      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  },
};
