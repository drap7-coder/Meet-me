import { ImageResponse } from "next/og";
import { BRAND } from "@/src/config/branding";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#F8FAFC",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 72,
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 44,
            boxShadow: "0 28px 90px rgba(17, 24, 39, 0.12)",
            display: "flex",
            height: "100%",
            justifyContent: "center",
            padding: "64px 82px",
            width: "100%"
          }}
        >
          <div style={{ alignItems: "center", display: "flex", flexDirection: "column" }}>
            <div
              style={{
                color: "#111827",
                fontSize: 132,
                fontWeight: 900,
                letterSpacing: -4,
                lineHeight: 0.9
              }}
            >
              {BRAND.name}
            </div>
            <div
              style={{
                color: "#6B7280",
                fontSize: 38,
                fontWeight: 700,
                lineHeight: 1.25,
                marginTop: 28
              }}
            >
              {BRAND.tagline}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
