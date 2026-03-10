'use client';

import HeroSection from "@/components/home/HeroSection";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";
import UseCases from "@/components/home/UseCases";
import FAQ from "@/components/home/FAQ";
import Footer from "@/components/home/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <HeroSection />
      <Features />
      <HowItWorks />
      <UseCases />
      <FAQ />
      <Footer />
    </div>
  );
}
