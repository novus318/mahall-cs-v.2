import { Metadata } from "next";
import Link from "next/link";
import { Scale, FileText, Users, Globe, ArrowLeft } from "lucide-react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";

export const metadata: Metadata = {
  title: "Terms and Conditions | Thayineri Muslim Jama-ath Committee",
  description: "Terms and Conditions governing the use of Thayineri Muslim Jama-ath Committee website and services.",
};

export default function TermsPage() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Terms and Conditions</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Please read these terms carefully before using our website or services.
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
                <Scale className="w-6 h-6 text-primary" />
                1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using this website, you accept and agree to be bound by the terms and
                provisions of this agreement. If you do not agree to abide by these terms, please do
                not use this website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-primary" />
                2. Use of Website
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>This website and its contents are intended for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Learning about our committee&apos;s activities and services</li>
                  <li>Making donations to support our community initiatives</li>
                  <li>Accessing information about religious and educational programs</li>
                  <li>Contacting us for inquiries and assistance</li>
                </ul>
                <p>
                  You agree not to use this website for any unlawful purpose or any purpose
                  prohibited under these terms.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                3. Donations and Payments
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <h3 className="font-semibold text-foreground">Donation Terms</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All donations are voluntary contributions to support our community services</li>
                  <li>Donations are generally non-refundable except as required by law or under specific circumstances</li>
                  <li>Donations are used at the discretion of the committee for community welfare</li>
                  <li>Tax benefits under Section 80G of Income Tax Act may be applicable (please consult your tax advisor)</li>
                </ul>

                <h3 className="font-semibold text-foreground mt-6">Payment Processing</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payments are processed through secure third-party payment gateways (Paytm)</li>
                  <li>We do not store your complete payment card details</li>
                  <li>All transactions are subject to the payment gateway&apos;s terms and conditions</li>
                  <li>You agree to provide accurate payment information</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on this website, including text, graphics, logos, images, and software, is
                the property of Thayineri Muslim Jama-ath Committee or its content suppliers and is
                protected by intellectual property laws. You may not reproduce, distribute, or modify
                any content without our prior written consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">5. User Conduct</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">When using our website, you agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Attempt to gain unauthorized access to any part of the website</li>
                <li>Introduce viruses, trojans, or other harmful code</li>
                <li>Use the website for any fraudulent or unlawful purpose</li>
                <li>Interfere with or disrupt the website&apos;s operation</li>
                <li>Harass, abuse, or harm other users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                This website is provided &quot;as is&quot; without any representations or warranties, express
                or implied. We make no representations or warranties in relation to this website or
                the information and materials provided on this website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Thayineri Muslim Jama-ath Committee shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, or any loss of profits or revenues, whether
                incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible
                losses resulting from your use of this website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                8. Governing Law
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws
                of India and the State of Kerala. Any disputes relating to these terms and conditions
                shall be subject to the jurisdiction of the courts of Kannur, Kerala.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-foreground font-medium">Thayineri Muslim Jama-ath Committee</p>
                <p className="text-muted-foreground">Email: thayinerijamaath@gmail.com</p>
                <p className="text-muted-foreground">Phone: +91 8129059992</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms and conditions at any time. Changes will
                be effective immediately upon posting on this website. Your continued use of the
                website after any changes constitutes acceptance of the new terms.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
