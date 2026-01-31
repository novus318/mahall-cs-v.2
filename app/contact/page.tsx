import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";

export const metadata: Metadata = {
  title: "Contact Us | Thayineri Muslim Jama-ath Committee",
  description: "Get in touch with Thayineri Muslim Jama-ath Committee for any inquiries or assistance.",
};

export default function ContactPage() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Contact Us</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              We&apos;d love to hear from you. Reach out to us for any inquiries or assistance.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Address</h3>
                    <p className="text-muted-foreground">
                      Thayineri Muslim Jama-ath Committee<br />
                      Thayineri, Payyanur<br />
                      Kannur District, Kerala - 670307
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                    <p className="text-muted-foreground">
                      <a href="tel:+919846676276" className="hover:text-primary transition-colors">
                        +91 8129059992
                      </a>
                      <br />
                      <a href="tel:+918129059992" className="hover:text-primary transition-colors">
                        +91 81290 59992
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Email</h3>
                    <p className="text-muted-foreground">
                      <a href="mailto:thayinerijamaath@gmail.com" className="hover:text-primary transition-colors">
                        thayinerijamaath@gmail.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Office Hours</h3>
                    <p className="text-muted-foreground">
                      Monday - Saturday: 9:00 AM - 6:00 PM<br />
                      Friday: Closed for Jumu&apos;ah<br />
                      Sunday: 10:00 AM - 2:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Send a Message</h2>
              <form className="bg-muted rounded-2xl p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" placeholder="Enter your full name" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="Enter your phone number" className="mt-2" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="Enter your email" className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="What is this regarding?" className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Write your message here..." className="mt-2 min-h-[120px]" />
                </div>
                <Button type="submit" className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Location Map</h2>
            <div className="bg-muted rounded-2xl p-4 h-96 flex items-center justify-center">
              <p className="text-muted-foreground">Map integration coming soon</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
