import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/seo/site";

export const runtime = "edge";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        color: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{ fontSize: 32, opacity: 0.7, letterSpacing: "0.2em", textTransform: "uppercase" }}
      >
        {siteConfig.name}
      </div>
      <div
        style={{
          fontSize: 84,
          fontWeight: 700,
          lineHeight: 1.05,
          marginTop: 24,
          maxWidth: 980,
        }}
      >
        {siteConfig.description}
      </div>
      <div style={{ fontSize: 26, opacity: 0.6, marginTop: 32 }}>
        {new URL(siteConfig.url).host}
      </div>
    </div>,
    { ...size },
  );
}
