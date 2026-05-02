"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Github, Check } from "lucide-react";

const PERKS = ["14-day free trial", "3 AI enhancements included", "8 resume templates", "No credit card needed"];

export default function RegisterPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <Badge className="mb-3 bg-green-100 text-green-700 border-green-200">Free 14-day trial</Badge>
          <h1 className="text-2xl font-bold text-gray-900">Start your AI job search</h1>
          <p className="text-gray-500 text-sm mt-1">No credit card required</p>
        </div>

        {/* Perks */}
        <div className="mb-6 rounded-xl bg-white border p-4">
          <ul className="space-y-2">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white border shadow-sm p-6 space-y-3">
          <Button onClick={() => handleOAuth("google")} disabled={loading !== null} variant="outline" className="w-full gap-3 h-11">
            {loading === "google" ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" /> : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Sign up with Google
          </Button>

          <Button onClick={() => handleOAuth("github")} disabled={loading !== null} variant="outline" className="w-full gap-3 h-11">
            {loading === "github" ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" /> : <Github className="h-4 w-4" />}
            Sign up with GitHub
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
        <p className="text-center text-sm text-gray-400 mt-3">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
