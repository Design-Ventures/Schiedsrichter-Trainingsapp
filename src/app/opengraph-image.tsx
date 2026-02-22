import { ImageResponse } from "next/og";

export const alt = "schiri.app — Werde ein besserer Schiedsrichter";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#18181B",
          padding: 80,
        }}
      >
        {/* Gradient bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #c084fc, #a78bfa, #818cf8, #93c5fd)",
          }}
        />

        {/* Logo */}
        <span
          style={{
            fontSize: 28,
            fontWeight: 400,
            letterSpacing: "0.04em",
            color: "#71717A",
            marginBottom: 40,
          }}
        >
          schiri.app
        </span>

        {/* Headline */}
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#FAFAFA",
            textAlign: "center",
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
          }}
        >
          Werde ein besserer
        </span>
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#FAFAFA",
            textAlign: "center",
            lineHeight: 1.15,
            letterSpacing: "-0.025em",
          }}
        >
          Schiedsrichter.
        </span>

        {/* Subtitle */}
        <span
          style={{
            fontSize: 24,
            fontWeight: 400,
            color: "#A1A1AA",
            marginTop: 32,
            textAlign: "center",
          }}
        >
          Echte DFB-Prüfungsfragen mit sofortigem Feedback
        </span>
      </div>
    ),
    { ...size }
  );
}
