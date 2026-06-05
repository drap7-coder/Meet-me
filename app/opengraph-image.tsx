import { ImageResponse } from "next/og";

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
          background: "#ffffff",
          color: "#111111",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28, width: 650 }}>
          <div style={{ alignItems: "center", display: "flex", gap: 18 }}>
            <BrandIcon size={72} />
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1 }}>Meet Me Halfway</div>
          </div>
          <div style={{ fontSize: 74, fontWeight: 900, letterSpacing: -4, lineHeight: 0.95 }}>
            Find the perfect place between you.
          </div>
          <div style={{ color: "#6E6E73", fontSize: 30, lineHeight: 1.25 }}>
            Two locations. One great place to meet.
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            background: "#F5F5F7",
            border: "1px solid #E5E5EA",
            borderRadius: 36,
            display: "flex",
            height: 390,
            justifyContent: "center",
            position: "relative",
            width: 390
          }}
        >
          <div style={{ background: "#D9D9DE", height: 2, position: "absolute", width: 250 }} />
          <div style={{ background: "#111111", borderRadius: 999, height: 30, left: 60, position: "absolute", width: 30 }} />
          <div style={{ background: "#111111", borderRadius: 999, height: 30, position: "absolute", right: 60, width: 30 }} />
          <div
            style={{
              background: "#0071E3",
              border: "12px solid rgba(0, 113, 227, 0.16)",
              borderRadius: 999,
              height: 58,
              position: "absolute",
              width: 58
            }}
          />
        </div>
      </div>
    ),
    size
  );
}

function BrandIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        alignItems: "center",
        background: "#111111",
        borderRadius: Math.round(size * 0.22),
        display: "flex",
        height: size,
        justifyContent: "center",
        position: "relative",
        width: size
      }}
    >
      <div style={{ background: "#ffffff", borderRadius: 999, height: size * 0.22, left: size * 0.2, position: "absolute", width: size * 0.22 }} />
      <div style={{ background: "#ffffff", borderRadius: 999, height: size * 0.22, position: "absolute", right: size * 0.2, width: size * 0.22 }} />
      <div style={{ background: "#0071E3", borderRadius: 999, height: size * 0.32, position: "absolute", width: size * 0.32 }} />
    </div>
  );
}
