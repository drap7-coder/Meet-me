import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#F8FAFC",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <svg width="310" height="310" viewBox="0 0 64 64">
          <path
            d="M32 4C43.6 4 53 13.4 53 25C53 39.2 37.9 54 32 61C26.1 54 11 39.2 11 25C11 13.4 20.4 4 32 4Z"
            fill="#FF6B6B"
          />
          <circle cx="32" cy="25" fill="#FFFFFF" r="8" />
        </svg>
      </div>
    ),
    size
  );
}
