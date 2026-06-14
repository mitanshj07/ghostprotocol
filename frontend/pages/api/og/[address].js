import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge"
};

export default function handler(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") || "GhostVault";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#080810",
          color: "#e8e8f0",
          padding: 72,
          fontFamily: "monospace"
        }}
      >
        <div style={{ color: "#1D9E75", fontSize: 32, marginBottom: 24 }}>GHOSTPROTOCOL</div>
        <div style={{ fontSize: 68, lineHeight: 1.05 }}>Cryptographic proof of life</div>
        <div style={{ color: "#888780", fontSize: 28, marginTop: 32 }}>{address}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
