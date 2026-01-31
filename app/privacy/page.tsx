import { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Eye, Database, ArrowLeft } from "lucide-react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Thayineri Muslim Jama-ath Committee",
  description: "Privacy Policy for Thayineri Muslim Jama-ath Committee - How we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <div className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container mx-auto px-4">
            <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              How we collect, use, and protect your personal information.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="prose prose-muted max-w-none">
            <p className="text-muted-foreground mb-8">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                1. Introduction
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Thayineri Muslim Jama-ath Committee (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
                you visit our website or make donations through our online payment system.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                2. Information We Collect
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <h3 className="font-semibold text-foreground">Personal Information</h3>
                <p>We may collect personal information that you voluntarily provide to us, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Name and contact information (phone number, email address)</li>
                  <li>Demographic information</li>
                  <li>Payment information (processed securely through Payment Gateway)</li>
                  <li>Transaction history for donations</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary" />
                3. How We Use Your Information
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>To process and acknowledge your donations</li>
                <li>To send you updates about our programs and activities</li>
                <li>To improve our website and services</li>
                <li>To comply with legal obligations</li>
                <li>To maintain proper records of all transactions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-primary" />
                4. Payment Processing & Data Security
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  All payment transactions are processed through secure Payment Gateway services (Paytm).
                  We do not store your complete credit/debit card details on our servers.
                </p>
                <p>
                  Our website uses industry-standard SSL encryption to protect your personal and financial
                  information during transmission. However, no method of transmission over the Internet is
                  100% secure.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party service providers to process donations and payments. These parties
                have their own privacy policies addressing how they use such information. We recommend
                reviewing their privacy policies for understanding their data practices.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Request access to your personal information</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information (subject to legal retention requirements)</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-foreground font-medium">Thayineri Muslim Jama-ath Committee</p>
                <p className="text-muted-foreground">Email: thayinerijamaath@gmail.com</p>
                <p className="text-muted-foreground">Phone: +91 8129059992</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material
                changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
