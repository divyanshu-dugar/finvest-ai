'use client';

import Link from 'next/link';
import { Brain, Github, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-violet-400/10">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Finvest AI
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <Link href="/login" className="hover:text-violet-400 transition-colors">
              Login
            </Link>
            <Link href="/register" className="hover:text-violet-400 transition-colors">
              Register
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Finvest AI. Built with ❤️ by Finvest Studios.
          </p>
        </div>
      </div>
    </footer>
  );
}
