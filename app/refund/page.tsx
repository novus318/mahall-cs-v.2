import { Metadata } from "next";
import Link from "next/link";
import { RefreshCw, CreditCard, Clock, AlertCircle, ArrowLeft } from "lucide-react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Thayineri Muslim Jama-ath Committee",
  description: "Refund and Cancellation Policy for donations made through Paytm Payment Gateway.",
};

export default function RefundPage() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Refund & Cancellation Policy</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Policy for donations and payments made through Paytm Payment Gateway.
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
                <CreditCard className="w-6 h-6 text-primary" />
                1. Payment Gateway Integration
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Our website uses Paytm Payment Gateway for processing all online donations and payments.
                  By making a payment through our website, you agree to be bound by Paytm&apos;s terms and
                  conditions as well as this refund policy.
                </p>
                <p>
                  <strong>Important:</strong> We recommend that you review Paytm&apos;s privacy policy and terms
                  of service at paytm.com before making any transactions.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <RefreshCw className="w-6 h-6 text-primary" />
                2. Refund Policy for Donations
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <h3 className="font-semibold text-foreground">General Policy</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All donations made to Thayineri Muslim Jama-ath Committee are generally <strong>non-refundable</strong></li>
                  <li>Donations are considered as voluntary contributions to our community welfare activities</li>
                  <li>Once a donation is successfully processed, it becomes part of our general fund</li>
                </ul>

                <h3 className="font-semibold text-foreground mt-6">Exceptions for Refunds</h3>
                <p>Refunds may be considered in the following exceptional circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Duplicate Transactions:</strong> If the same donation is accidentally processed twice</li>
                  <li><strong>Technical Errors:</strong> If the donation amount deducted is different from the intended amount due to a technical error</li>
                  <li><strong>Fraudulent Transactions:</strong> If the transaction was made without the donor&apos;s authorization</li>
                  <li><strong>Payment Gateway Failure:</strong> If the payment was confirmed by your bank but not received by us</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-primary" />
                3. Refund Request Process
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>To request a refund, you must follow this process:</p>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Contact us within <strong>7 days</strong> of the transaction</li>
                  <li>Provide the following information:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Full name as used in the transaction</li>
                      <li>Phone number registered with Paytm</li>
                      <li>Transaction ID (if available)</li>
                      <li>Date and time of transaction</li>
                      <li>Amount deducted</li>
                      <li>Reason for refund request</li>
                    </ul>
                  </li>
                  <li>Our team will verify the transaction within 5-7 working days</li>
                  <li>If the refund is approved, it will be processed through the original payment method</li>
                </ol>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-foreground font-medium">Contact for Refund Requests:</p>
                  <p className="text-muted-foreground">Email: thayinerijamaath@gmail.com</p>
                  <p className="text-muted-foreground">Phone: +91 8129059992</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                4. Refund Timeline
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Once a refund request is approved:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Refunds will be processed within <strong>5-10 working days</strong> after approval</li>
                  <li>Credit Card/Debit Card refunds may take <strong>7-15 business days</strong> to reflect in your account (depending on the bank)</li>
                  <li>UPI refunds are typically processed within <strong>2-5 business days</strong></li>
                  <li>Net Banking refunds may take <strong>5-7 business days</strong></li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Cancellation Policy</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Regarding payment transactions:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Before Payment Completion:</strong> You can cancel a transaction at any time before the payment is successfully processed</li>
                  <li><strong>After Payment Completion:</strong> Once a payment is successfully processed and confirmed, it cannot be cancelled. Only refund requests as per Section 2 will be considered</li>
                  <li><strong>Pending Transactions:</strong> If a transaction appears pending or failed, please allow 24-48 hours for the status to update before contacting support</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Non-Refundable Situations</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The following donations are <strong>not eligible for refund</strong>:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Change of mind after successful donation</li>
                <li>Donations made more than 7 days ago (without valid exception)</li>
                <li>Donations where the donor cannot provide adequate verification details</li>
                <li>Donations that have already been utilized for community welfare activities</li>
                <li>Transactions declined by your bank that did not result in a successful charge</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">7. Failed/Declined Transactions</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>If your payment attempt fails or is declined:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>No amount will be deducted from your account for failed transactions</li>
                  <li>Please check with your bank or payment provider for the reason of decline</li>
                  <li>You may attempt the transaction again after resolving the issue</li>
                  <li>If money is deducted but transaction shows failed, please contact us immediately with transaction details</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Tax Deduction Certificates</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have made a donation and are eligible for tax benefits under Section 80G of the
                Income Tax Act, you may request a donation certificate. Please contact us with your
                transaction details to obtain the certificate. Note that requesting a refund will void
                any tax deduction eligibility for that particular donation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For any questions regarding this Refund and Cancellation Policy, please contact us:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-foreground font-medium">Thayineri Muslim Jama-ath Committee</p>
                <p className="text-muted-foreground">Email: thayinerijamaath@gmail.com</p>
                <p className="text-muted-foreground">Phone: +91 8129059992</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Policy Updates</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify this refund and cancellation policy at any time. Changes
                will be effective immediately upon posting on this website. We encourage you to review
                this policy periodically.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
