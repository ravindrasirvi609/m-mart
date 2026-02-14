import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    request.cookies.set(name, value);
                    supabaseResponse.cookies.set(name, value, options);
                });
            },
        },
    });

    // IMPORTANT: Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to
    // debug issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    // Refreshing the auth token is critical to keep the session alive.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // IMPORTANT: You *must* return the supabaseResponse object as is.
    // If you create a new response object with NextResponse.next(), make sure
    // to:
    //   1. Pass the request in it:  NextResponse.next({ request })
    //   2. Copy cookies over:       myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    //   3. Return the new response
    // If this is not done, the browser and server go out of sync and the
    // user's session can be terminated prematurely.

    return supabaseResponse;
}
