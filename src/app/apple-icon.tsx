import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#18181B",
          borderRadius: 40,
        }}
      >
        <span
          style={{
            fontSize: 90,
            fontWeight: 500,
            letterSpacing: "0.04em",
            color: "#A1A1AA",
          }}
        >
          s
        </span>
      </div>
    ),
    { ...size }
  );
}
