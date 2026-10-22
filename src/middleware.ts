import { NextResponse, type NextRequest } from "next/server";

/**
 * Protección optimista: sin cookie de sesión no se entra a zonas privadas.
 * La autorización real (rol, propiedad de datos) se valida SIEMPRE en el servidor.
 */
export function middleware(req: NextRequest) {
  if (!req.cookies.get("df_session")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/panel/:path*", "/admin/:path*"] };
