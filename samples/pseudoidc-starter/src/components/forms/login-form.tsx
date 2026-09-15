"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/authClient";
import Image from "next/image";
import Link from "next/link";

export default function LoginForm() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
    const [error, setError] = useState("");
    const [oauthLoading, setOauthLoading] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setError("");
        try {
            const res = await fetch("/api/auth/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setStatus("sent");
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.message || "Failed to send magic link");
                setStatus("error");
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred");
            }
            setStatus("error");
        }
    };

    const handleOAuthLogin = () => {
        setOauthLoading(true);
        authClient.signIn.oauth2({
            providerId: "consentkeys-oidc",
            callbackURL: `/protected`,
        });
    };

    return (
        <div className="max-w-md w-full mx-auto my-10 px-5">
            <div className="p-8 flex flex-col items-center gap-6 shadow-lg bg-white rounded-lg border border-gray-200">
                <div className="flex flex-col items-center gap-2">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">Y</span>
                        </div>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-xl font-bold">
                            Your App
                        </span>
                    </Link>
                    <p className="text-gray-500 text-center text-sm">Please login to continue</p>
                </div>
                
                <form onSubmit={handleEmailLogin} className="w-full space-y-4" aria-label="Email login form">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            disabled={status === "loading" || status === "sent"}
                            aria-invalid={status === "error"}
                            aria-describedby={status === "error" ? "email-error" : undefined}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={status === "loading" || status === "sent"} 
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed"
                    >
                        {status === "loading" ? "Sending..." : status === "sent" ? "Sent!" : "Send Magic Link"}
                    </button>
                    
                    {status === "sent" && (
                        <div className="flex items-center gap-2 text-green-600 text-sm mt-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Check your email for the magic link!</span>
                        </div>
                    )}
                    
                    {status === "error" && (
                        <div className="flex items-center gap-2 text-red-600 text-sm mt-1" id="email-error">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                </form>
                
                <div className="my-4 flex flex-col items-center justify-center gap-2 w-full">
                    <span className="text-gray-400 text-xs">or</span>
                </div>
                
                <button
                    onClick={handleOAuthLogin}
                    disabled={oauthLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md border border-transparent transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {oauthLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Logging in...
                        </span>
                    ) : (
                        <>
                            <Image src="/ck-logo-trans.svg" alt="ConsentKeys" width={20} height={20} />
                            Login with ConsentKeys
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
