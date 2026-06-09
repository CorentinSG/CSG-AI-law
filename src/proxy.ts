import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  attachAdminSession,
  clearAdminSession,
  requestHasAdminSession,
  requestHasValidAdminAuth,
} from "@/lib/admin-auth";

function buildUnauthorizedAdminHtml() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin authentication required</title>
    <style>
      :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top, rgba(125, 211, 252, 0.14), transparent 24%),
          linear-gradient(180deg, #090a0f 0%, #07080c 42%, #09090b 100%);
        color: #f4f4f5;
      }
      main {
        width: min(720px, calc(100vw - 2rem));
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 28px;
        padding: 2rem;
        background: rgba(255,255,255,0.04);
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
      }
      .eyebrow { font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: #a1a1aa; }
      h1 {
        margin: 0.9rem 0 0;
        font-size: clamp(2rem, 5vw, 3.4rem);
        line-height: 0.94;
        letter-spacing: -0.05em;
        text-transform: uppercase;
      }
      p { color: #d4d4d8; line-height: 1.75; }
      .grid { display: grid; gap: 1rem; margin-top: 1.4rem; }
      .card {
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 20px;
        padding: 1rem 1rem 1.1rem;
        background: rgba(0,0,0,0.12);
      }
      .card strong {
        display: block;
        margin-bottom: 0.45rem;
        color: #fafafa;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 11px;
      }
      a { color: #e4e4e7; }
    </style>
  </head>
  <body>
    <main>
      <div class="eyebrow">Private admin review</div>
      <h1>Authentication required</h1>
      <p>
        This route is part of the private review desk. Use the admin credentials configured for this environment to continue.
      </p>
      <div class="grid">
        <div class="card">
          <strong>What this protects</strong>
          Admin review queues, source diagnostics, unpublished legal items, and governance tooling remain hidden until authentication succeeds.
        </div>
        <div class="card">
          <strong>What to do next</strong>
          Your browser should prompt for credentials. If it does not, refresh the page or return to the public site and try again.
        </div>
      </div>
      <p style="margin-top: 1.3rem;"><a href="/">Return to the public site</a></p>
    </main>
  </body>
</html>`;
}

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (requestHasAdminSession(request)) {
    return NextResponse.next();
  }

  if (!requestHasValidAdminAuth(request)) {
    const unauthorized = new NextResponse(buildUnauthorizedAdminHtml(), {
      status: 401,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "WWW-Authenticate": 'Basic realm="Admin"',
      },
    });
    return clearAdminSession(unauthorized);
  }

  const response = NextResponse.next();
  return attachAdminSession(response);
}

export const config = {
  matcher: ["/admin/:path*"],
};
