"use client";

export default function LogoScreen() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle at 50% 45%, #2a1f5c 0%, #0c081a 75%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p
        className="redaction-50"
        style={{
          margin: 0,
          fontSize: 36,
          fontStyle: "normal",
          color: "#f2eeff",
          textShadow: "0 0 12px rgba(200,170,255,0.85), 0 0 28px rgba(160,120,255,0.6)",
        }}
      >
        hannah shin
      </p>
    </div>
  );
}
