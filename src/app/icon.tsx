import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={28} height={28} alt="" />
      </div>
    ),
    { ...size },
  );
}
