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
          background: "#111111",
          borderRadius: 112,
          display: "flex",
          height: "100%",
          justifyContent: "center",
          position: "relative",
          width: "100%"
        }}
      >
        <div style={{ background: "#ffffff", borderRadius: 999, height: 112, left: 104, position: "absolute", width: 112 }} />
        <div style={{ background: "#ffffff", borderRadius: 999, height: 112, position: "absolute", right: 104, width: 112 }} />
        <div style={{ background: "#1F5EFF", borderRadius: 999, height: 160, position: "absolute", width: 160 }} />
      </div>
    ),
    size
  );
}
