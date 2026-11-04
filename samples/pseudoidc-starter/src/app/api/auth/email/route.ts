
import { authClient } from "@/lib/auth/authClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    console.log('📧 Email auth endpoint called');

    try {
        const { email } = await req.json();
        console.log('📧 Email received:', email);

        if (!email) {
            console.error('❌ No email provided');
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        console.log('🔗 Attempting to send magic link to:', email);
        console.log('🔗 Callback URL:', `${process.env.NEXT_PUBLIC_URL}/protected`);

        const result = await authClient.signIn.magicLink({
            email,
            callbackURL: `${process.env.NEXT_PUBLIC_URL}/protected`,
        });

        console.log('✅ Magic link result:', JSON.stringify(result, null, 2));
        return NextResponse.json({ success: result?.data?.status === true });
    } catch (e) {
        console.error('❌ Magic link error:', e);
        console.error('❌ Error stack:', e instanceof Error ? e.stack : 'No stack trace');
        return NextResponse.json({ message: "Failed to send magic link", error: String(e) }, { status: 500 });
    }
}
