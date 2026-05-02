import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles, FileText, Briefcase, TrendingUp, Users,
  Zap, CheckCircle, Star, ArrowRight, Bot, Target,
  Linkedin, BarChart3, MessageSquare, Shield,
} from "lucide-react";

export const metadata = {
  title: "ResumeAI Pro — Get Hired 3x Faster with AI",
  description: "AI-powered resume builder with job alignment, probability scoring, and LinkedIn automation.",
};

const STATS = [
  { value: "3x", label: "More interviews" },
  { value: "87%", label: "ATS pass rate" },
  { value: "2min", label: "Average enhancement time" },
  { value: "50k+", label: "Resumes optimized" },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Resume Enhancement",
    desc: "Transform weak bullets into powerful achievements. ATS-optimized, STAR method, quantifiable metrics — automatically.",
    tier: "Free",
  },
  {
    icon: Target,
    title: "Job Alignment Engine",
    desc: "Paste any job description. AI rewrites your entire resume to match. Score jumps from 60% to 90%+ alignment.",
    tier: "Pro",
  },
  {
    icon: BarChart3,
    title: "Probability Scoring",
    desc: "Know your chances before you apply. Realistic interview probability, competitive ranking, improvement roadmap.",
    tier: "Pro",
  },
  {
    icon: Linkedin,
    title: "LinkedIn Job Fetcher",
    desc: "Set your criteria. AI scrapes LinkedIn daily, scores every job against your profile, surfaces only the best matches.",
    tier: "Pro",
  },
  {
    icon: Bot,
    title: "Auto-Apply",
    desc: "AI fills LinkedIn Easy Apply forms. Stops at final confirmation — you always click submit. Never applies without consent.",
    tier: "Enterprise",
  },
  {
    icon: Users,
    title: "Contact Finder",
    desc: "Identifies hiring managers, team leads, and CEOs. Generates personalized outreach messages. Tracks responses.",
    tier: "Enterprise",
  },
];

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Software Engineer → Google", text: "The job alignment feature got me from 40% match to 92% on a Google JD. Landed the role in 3 weeks.", stars: 5 },
  { name: "Marcus R.", role: "Product Manager → Stripe", text: "The probability scorer told me I was at 34% and showed me exactly what to fix. Pushed to 78%, got the interview.", stars: 5 },
  { name: "Priya M.", role: "Data Scientist → OpenAI", text: "LinkedIn auto-apply + contact finder is insane. 47 applications sent in one week, 12 responses.", stars: 5 },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ResumeAI Pro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/login">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="gradient" size="sm">Start free →</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container text-center max-w-4xl">
          <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
            <Sparkles className="h-3 w-3 mr-1" /> Powered by Claude AI & GPT-4
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Land your dream job{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              3x faster
            </span>
            {" "}with AI
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            AI rewrites your resume to perfectly match any job. Know your probability before applying.
            Auto-apply to 10 jobs/day. Contact the hiring manager directly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/register">
              <Button variant="gradient" size="xl" className="gap-2 w-full sm:w-auto">
                Start free — 14 day trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">View pricing</Button>
            </Link>
          </div>
          <p className="text-sm text-gray-400">No credit card required · Cancel anytime · 14-day free trial</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-gray-50 py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need to get hired</h2>
            <p className="text-gray-500 max-w-xl mx-auto">From resume creation to auto-applying — the complete AI job search platform</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title} className="hover:shadow-lg transition-all duration-200 group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                      <f.icon className="h-5 w-5 text-white" />
                    </div>
                    <Badge variant={f.tier === "Enterprise" ? "enterprise" : f.tier === "Pro" ? "pro" : "secondary"} className="text-xs">
                      {f.tier}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-24 px-4">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Real people, real results</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="container text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Start your AI-powered job search today</h2>
          <p className="text-gray-500 mb-8">14-day free trial. No credit card. Cancel anytime.</p>
          <Link href="/register">
            <Button variant="gradient" size="xl" className="gap-2">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-indigo-600">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">ResumeAI Pro</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/pricing" className="hover:text-gray-600">Pricing</Link>
            <Link href="/login" className="hover:text-gray-600">Sign in</Link>
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> SOC2 Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
