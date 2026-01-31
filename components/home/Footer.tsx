import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="font-bold text-lg text-foreground">THAYINERI MUSLIM JAMA-ATH COMMITTEE</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Thayineri Muslim Jama-ath Committee - Serving the community with faith and unity
              in Payyanur, Kannur, Kerala since 1998.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground text-sm">Home</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground text-sm">About Us</Link></li>
              <li><Link href="/#services" className="text-muted-foreground hover:text-foreground text-sm">Services</Link></li>
              <li><Link href="/#donation" className="text-muted-foreground hover:text-foreground text-sm">Donation</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Policies</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm">Terms & Conditions</Link></li>
              <li><Link href="/refund" className="text-muted-foreground hover:text-foreground text-sm">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                Thayineri, Payyanur, Kannur
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary" />
                +91 8129059992
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-primary" />
                thayinerijamaath@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Thayineri Muslim Jama-ath Committee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
