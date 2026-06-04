import { useEffect, useState } from "react";

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1600);
    const doneTimer = setTimeout(() => onDone(), 2100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a0a00 50%, #0f0f0f 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        transition: "opacity 0.5s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "all",
      }}
    >
      <div
        style={{
          animation: "splashPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "28px",
            background: "linear-gradient(145deg, #FF6B00, #FF3C00)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 60px rgba(255, 60, 0, 0.5), 0 0 120px rgba(255, 60, 0, 0.2)",
          }}
        >
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="36" cy="36" rx="28" ry="20" stroke="white" strokeWidth="3" fill="none" />
            <ellipse cx="36" cy="36" rx="28" ry="20" stroke="white" strokeWidth="3" fill="none" transform="rotate(90 36 36)" />
            <line x1="36" y1="8" x2="36" y2="64" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="8" y1="36" x2="64" y2="36" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="36" cy="36" r="5" fill="white" />
          </svg>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "64px",
              lineHeight: 1,
              letterSpacing: "6px",
              color: "white",
              textShadow: "0 0 30px rgba(255,100,0,0.6)",
            }}
          >
            SPL
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "13px",
              letterSpacing: "3px",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              marginTop: "2px",
            }}
          >
            Saurashtra Premier League
          </div>
        </div>

        <div
          style={{
            width: "160px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #FF6B00, transparent)",
            borderRadius: "2px",
            animation: "splashLine 0.8s ease 0.3s forwards",
            opacity: 0,
          }}
        />

        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "1px",
            textAlign: "center",
            animation: "splashFadeUp 0.6s ease 0.5s forwards",
            opacity: 0,
          }}
        >
          Created by{" "}
          <span style={{ color: "rgba(255,150,50,0.8)", fontWeight: 600 }}>Rohit Mukati</span>
          {" & "}
          <span style={{ color: "rgba(255,150,50,0.8)", fontWeight: 600 }}>Yash Rathore</span>
        </div>
      </div>

      <style>{`
        @keyframes splashPop {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashLine {
          from { opacity: 0; transform: scaleX(0); }
          to   { opacity: 1; transform: scaleX(1); }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
