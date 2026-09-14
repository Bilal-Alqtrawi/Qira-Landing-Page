import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "منصة قِرى | Qira - سيستم سحابي لإدارة المطاعم والمقاهي";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #042415 0%, #0A0F0D 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 70px",
        fontFamily: "sans-serif",
        direction: "rtl",
        color: "#ffffff",
      }}
    >
      {/* الهيدر العلوي */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "14px",
              background: "#006C35",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              fontWeight: "bold",
              color: "#ffffff",
            }}
          >
            Q
          </div>
          <span
            style={{
              fontSize: "38px",
              fontWeight: "bold",
              letterSpacing: "-0.5px",
            }}
          >
            Qira | منصة قِرى
          </span>
        </div>
        <div
          style={{
            background: "rgba(0, 108, 53, 0.25)",
            border: "1px solid #006C35",
            padding: "8px 22px",
            borderRadius: "50px",
            color: "#4ADE80",
            fontSize: "20px",
            fontWeight: 600,
          }}
        >
          نظام سحابي SaaS
        </div>
      </div>

      {/* النص الرئيسي */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxWidth: "950px",
        }}
      >
        <h1
          style={{
            fontSize: "54px",
            fontWeight: 800,
            lineHeight: 1.25,
            margin: 0,
            color: "#FFFFFF",
          }}
        >
          سيستم يظبط إدارة مطعمك وكافيهك بالكامل
        </h1>
        <p
          style={{
            fontSize: "25px",
            color: "#9CA3AF",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          الكاشير، نظام المطبخ الرقمي، منيو الـ QR، والفوترة المعتمدة من زاتكا
          بجهة واحدة.
        </p>
      </div>

      {/* الميزات الأساسية */}
      <div style={{ display: "flex", gap: "14px" }}>
        {["كاشير POS", "شاشة المطبخ KDS", "منيو QR", "فوترة زاتكا 100%"].map(
          (item) => (
            <div
              key={item}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "12px 22px",
                fontSize: "20px",
                color: "#E5E7EB",
                fontWeight: 500,
              }}
            >
              {item}
            </div>
          ),
        )}
      </div>
    </div>,
    {
      ...size,
    },
  );
}
