import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ArrowLeft } from "lucide-react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";

export const metadata: Metadata = {
  title: "About Us | Thayineri Muslim Jama-ath Committee",
  description: "Learn more about Thayineri Muslim Jama-ath Committee, serving the community with faith and unity in Payyanur, Kannur, Kerala.",
};

export default function AboutPage() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">About Us</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Serving the community with faith and unity since 1998.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Thayineri Muslim Jama-ath Committee is a registered social and religious organization 
                  operating under the auspices of Thayineri Muslim Education Society, located in the 
                  Payyanur Taluk of Kannur District, Kerala.
                </p>
                <p>
                  Established with a vision to serve the community and promote Islamic values, education, 
                  and social welfare, we have been working tirelessly for over 25 years to make a positive 
                  impact on the lives of people in our locality.
                </p>
                <p>
                  Our committee operates under the broader supervision of recognized Sunni Islamic bodies 
                  in Kerala, including the Samastha Kerala Jamiyyathul Ulama, ensuring that our activities 
                  align with authentic Islamic principles and serve the best interests of the community.
                </p>
              </div>
            </div>

            <div className="bg-muted rounded-2xl p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Key Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Location</p>
                    <p className="text-muted-foreground">Thayineri, Payyanur Taluk, Kannur District, Kerala</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Established</p>
                    <p className="text-muted-foreground">1998 (25+ Years of Service)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Affiliation</p>
                    <p className="text-muted-foreground">Registered under Societies Registration Act</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6">Our Mission</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-muted rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-2">Religious Services</h3>
                <p className="text-muted-foreground text-sm">
                  Providing religious guidance, organizing prayers, and conducting religious ceremonies 
                  according to Islamic traditions.
                </p>
              </div>
              <div className="bg-muted rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-2">Education</h3>
                <p className="text-muted-foreground text-sm">
                  Promoting Islamic and secular education through coordination with Thayineri Muslim 
                  Education Society and other institutions.
                </p>
              </div>
              <div className="bg-muted rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-2">Social Welfare</h3>
                <p className="text-muted-foreground text-sm">
                  Supporting the needy, providing financial assistance, and organizing community 
                  welfare programs for the betterment of society.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
