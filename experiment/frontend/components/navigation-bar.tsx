// Added navigation bar
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Added navigation bar — styles injected once, no extra CSS file
const NAV_STYLES = `
  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 20px;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 500;
    letter-spacing: 0.01em;
    text-decoration: none;
    color: rgba(148,163,184,0.9);
    border: 1px solid transparent;
    transition:
      color 0.2s ease,
      background 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.15s ease;
    position: relative;
    white-space: nowrap;
  }
  .nav-link:hover {
    color: #e2e8f0;
    background: rgba(255,255,255,0.06);
    transform: translateY(-1px);
  }
  .nav-link.active {
    color: #ffffff;
    background: linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.25) 100%);
    border-color: rgba(139,92,246,0.4);
    box-shadow:
      0 0 0 1px rgba(99,102,241,0.15) inset,
      0 4px 16px rgba(99,102,241,0.2),
      0 1px 3px rgba(0,0,0,0.3);
  }
  .nav-link.active .nav-dot {
    background: #818cf8;
    box-shadow: 0 0 6px rgba(129,140,248,0.8);
  }
  .nav-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border-radius: 20px;
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: rgba(99,102,241,0.2);
    color: #a5b4fc;
    border: 1px solid rgba(99,102,241,0.25);
    margin-left: 2px;
    line-height: 1.6;
  }
`;

const ROUTES = [
  {
    label: "Detection",
    href: "/",
    badge: null,
    icon: (
      // scan/bounding-box icon
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
      </svg>
    ),
  },
  {
    label: "Recognition",
    href: "/recognition",
    badge: null,
    icon: (
      // text-cursor / OCR icon
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7V4h6M14 4h6v3M4 17v3h6M14 20h6v-3" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  },
] as const;

export function NavigationBar() {
  const pathname = usePathname();

  return (
    <>
      <style suppressHydrationWarning>{NAV_STYLES}</style>

      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          background:
            "linear-gradient(180deg, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.88) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 28px",
          height: "56px",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Added navigation bar — brand mark */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            marginRight: "auto",
            flexShrink: 0,
          }}
        >
          {/* Logomark — stylised K glyph */}
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(99,102,241,0.5)",
              flexShrink: 0,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 4h14M5 12h8M5 20h14M13 8l4 4-4 4" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: "13.5px",
                letterSpacing: "0.01em",
                color: "#f1f5f9",
                lineHeight: 1,
              }}
            >
              Khmer OCR
            </span>
            <span
              style={{
                fontWeight: 400,
                fontSize: "10.5px",
                color: "rgba(148,163,184,0.6)",
                letterSpacing: "0.02em",
                lineHeight: 1,
              }}
            >
              Annotation Tool
            </span>
          </div>
        </Link>

        {/* Added navigation bar — pill tab group */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.07)",
            padding: "3px",
          }}
        >
          {ROUTES.map(({ label, href, badge, icon }) => {
            // Added default page logic — "/" is active for Detection
            const isActive =
              href === "/"
                ? pathname === "/" || pathname === ""
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActive ? " active" : ""}`}
              >
                {/* Active state glow dot */}
                <span
                  className="nav-dot"
                  style={{
                    display: "inline-block",
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: isActive ? "#818cf8" : "rgba(148,163,184,0.3)",
                    flexShrink: 0,
                    transition: "background 0.2s, box-shadow 0.2s",
                  }}
                />
                {icon}
                {label}
                {badge && <span className="nav-badge">{badge}</span>}
              </Link>
            );
          })}
        </div>

        {/* Added navigation bar — version tag */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: "rgba(100,116,139,0.7)",
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            v1.0
          </span>
        </div>
      </nav>
    </>
  );
}
