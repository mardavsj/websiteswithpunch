import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const res = await fetch("https://www.websiteswithpunch.com/logo.png", {
    next: { revalidate: 86400 },
  });
  const buf = await res.arrayBuffer();
  const b64 = Buffer.from(buf).toString("base64");
  const src = `data:image/png;base64,${b64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#EEF3FF",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={176} height={176} alt="" />
      </div>
    ),
    { ...size },
  );
}
