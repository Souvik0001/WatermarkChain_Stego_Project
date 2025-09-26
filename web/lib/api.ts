// API client for watermarking (image/video) and blockchain operations

export interface WatermarkResponse {
  success: boolean;
  data?: Blob;        // image/png or video/mp4|avi
  error?: string;
}

export interface ExtractResponse {
  success: boolean;
  text?: string;
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  hash?: string;
  txHash?: string;
  error?: string;
}

export interface VerifyResponse {
  success: boolean;
  exists?: boolean;
  hash?: string;
  owner?: string;
  timestamp?: number;
  note?: string;
  error?: string;
}

export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
const DEFAULT_Q = Number(process.env.NEXT_PUBLIC_DEFAULT_Q || 12);

class ApiClient {
  // Point straight at the Node server (not Next.js API routes)
  private baseUrl = `${API_ORIGIN}/api`;

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    const ctype = response.headers.get("content-type") || "";
    const cdisp = response.headers.get("content-disposition") || "";

    // Treat images, videos, and generic binary as Blob
    if (
      ctype.includes("image/") ||
      ctype.includes("video/") ||
      ctype.includes("application/octet-stream") ||
      cdisp.toLowerCase().includes("attachment")
    ) {
      return (await response.blob()) as T;
    }

    // Otherwise expect JSON
    return (await response.json()) as T;
  }

  // ---------------------- IMAGE ----------------------

  async embedWatermark(
    file: File,
    text: string,
    key: string,
    strength: number = DEFAULT_Q
  ): Promise<WatermarkResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("text", text);
      formData.append("key", key);
      formData.append("q", String(strength ?? DEFAULT_Q));

      const res = await fetch(`${this.baseUrl}/watermark/image`, {
        method: "POST",
        body: formData,
      });

      const data = await this.handleResponse<Blob>(res); // server returns PNG
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to embed watermark",
      };
    }
  }

  async extractWatermark(
    file: File,
    key: string,
    strength: number = DEFAULT_Q
  ): Promise<ExtractResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", key);
      formData.append("q", String(strength ?? DEFAULT_Q));

      const res = await fetch(`${this.baseUrl}/watermark/image/extract`, {
        method: "POST",
        body: formData,
      });

      const data = await this.handleResponse<{ text: string }>(res);
      return { success: true, text: data.text };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to extract watermark",
      };
    }
  }

  // ---------------------- VIDEO ----------------------

  async embedVideo(
    file: File,
    text: string,
    key: string,
    strength: number = DEFAULT_Q,
    every: number = 5
  ): Promise<WatermarkResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("text", text);
      formData.append("key", key);
      formData.append("q", String(strength ?? DEFAULT_Q));
      formData.append("every", String(every ?? 5));

      const res = await fetch(`${this.baseUrl}/watermark/video`, {
        method: "POST",
        body: formData,
      });

      // server returns MP4 (or AVI fallback) as binary
      const data = await this.handleResponse<Blob>(res);
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to embed video",
      };
    }
  }

  async extractVideo(
    file: File,
    key: string,
    strength: number = DEFAULT_Q,
    every: number = 5,
    maxSamples: number = 60
  ): Promise<ExtractResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", key);
      formData.append("q", String(strength ?? DEFAULT_Q));
      formData.append("every", String(every ?? 5));
      formData.append("max_samples", String(maxSamples ?? 60));

      const res = await fetch(`${this.baseUrl}/watermark/video/extract`, {
        method: "POST",
        body: formData,
      });

      const data = await this.handleResponse<{ text: string }>(res);
      return { success: true, text: data.text };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract video watermark",
      };
    }
  }

  // -------------------- BLOCKCHAIN --------------------

  async registerFile(file: File, note: string): Promise<RegisterResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("note", note);

      const res = await fetch(`${this.baseUrl}/register`, {
        method: "POST",
        body: formData,
      });

      const data = await this.handleResponse<{ hash: string; txHash: string }>(
        res
      );
      return { success: true, hash: data.hash, txHash: data.txHash };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to register file",
      };
    }
  }

  async verifyFile(file: File): Promise<VerifyResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${this.baseUrl}/verify`, {
        method: "POST",
        body: formData,
      });

      const data = await this.handleResponse<{
        exists: boolean;
        hash: string;
        owner: string;
        timestamp: number;
        note: string;
      }>(res);

      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to verify file",
      };
    }
  }
}

// ---------- helper to trigger browser download ----------
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // release object url shortly after
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const api = new ApiClient();
