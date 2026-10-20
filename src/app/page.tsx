import Link from "next/link";
import { QrCode, Utensils, Award, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-neutral-900 flex flex-col justify-between p-6 max-w-md mx-auto">
      {/* Brand Header */}
      <div className="pt-8 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold tracking-wide border border-primary-200/50 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Mobile Dining & Loyalty Experience
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          L&apos;Atelier Gourmet
        </h1>
        <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
          Artisan dining, instant QR contactless ordering, and the collector&apos;s Connoisseur Quest rewards.
        </p>
      </div>

      {/* Visual Feature Cards */}
      <div className="my-8 space-y-3">
        <Link
          href="/r/latelier"
          className="group block p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle hover:border-primary-300 hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-medium">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                  Open Restaurant Menu
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Browse dishes, select doneness, order to table
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/demo"
          className="group block p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle hover:border-primary-300 hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-medium">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                  QR Code Generator & Tables
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Scan simulation across Window, Booth, Patio tables
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/puzzle"
          className="group block p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle hover:border-primary-300 hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-medium">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                  Jigsaw Puzzle & Lucky Draw
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Collect crest pieces and select grand prizes
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>

        <Link
          href="/staff"
          className="group block p-4 rounded-2xl bg-surface border border-neutral-200/80 shadow-subtle hover:border-primary-300 hover:shadow-card transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-medium">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                  Staff Verification Portal
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Approve eligible return visit loyalty pieces
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-neutral-400 pb-4">
        <p>YourFood Mobile-First Hospitality Platform</p>
        <p className="text-[11px] mt-1 text-neutral-400">Strictly Non-Manipulative • Zero Nudge Philosophy</p>
      </footer>
    </main>
  );
}