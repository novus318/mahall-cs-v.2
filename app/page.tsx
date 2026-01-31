"use client";

import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Services from "@/components/home/Services";
import Donation from "@/components/home/Donation";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <About />
        <Services />
        <Donation />
      </main>
      <Footer />
    </div>
  );
}
