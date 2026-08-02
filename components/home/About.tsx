"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Users, BookOpen, Heart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);


export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imageRef.current,
        { clipPath: "circle(0% at 50% 50%)", opacity: 0 },
        {
          clipPath: "circle(150% at 50% 50%)",
          opacity: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        contentRef.current,
        { x: 100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.fromTo(
        statsRef.current?.children || [],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      gsap.to(imageRef.current, {
        y: -50,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-20 md:py-32 overflow-hidden bg-muted"
    >
      <div className="absolute inset-0 pattern-lines opacity-10" />

      <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-64 h-64 border border-border rotate-45 animate-rotate-slow opacity-30" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
<div ref={imageRef} className="relative max-w-lg mx-auto lg:mx-0">
              <div className="relative rounded-2xl overflow-hidden shadow-soft-lg">
                <img
                  src="/about-mosque.jpg"
                  alt="Community prayer"
                  className="w-full h-[320px] sm:h-[400px] md:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-foreground text-primary-foreground p-5 sm:p-6 rounded-xl shadow-soft-lg">
                <p className="font-bold text-2xl sm:text-3xl">25+</p>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Years of Service</p>
              </div>

              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-border rounded-2xl -z-10" />
            </div>

          <div ref={contentRef} className="lg:pl-8">
            <p className="text-primary font-semibold text-sm tracking-[0.25em] mb-3">
              ABOUT US
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              Serving the Community<br />
              <span className="text-muted-foreground">With Dedication</span>
            </h2>

            <div className="space-y-4 text-muted-foreground leading-relaxed mb-8">
              <p>
                Thayineri Muslim Jama-ath Committee is a registered entity located in the
                Payyanur Taluk of Kannur District, Kerala. We are committed to providing
                religious, educational, and social services to our community.
              </p>
              <p>
                Under the broader supervision of Sunni Islamic bodies in Kerala, such as
                the Samastha Kerala Jamiyyathul Ulama, we strive to create an environment
                of faith, learning, and mutual support for all community members.
              </p>
              <p>
                The committee is part of the local administration of mosques and community
                affairs, working closely with the Thayineri Muslim Education Society to
                provide comprehensive services to our community.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => scrollToSection("#services")}
                className="bg-foreground text-primary-foreground hover:bg-foreground/90 font-semibold px-6 h-12 rounded-lg transition-all duration-300 group"
              >
                Our Services
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => scrollToSection("#contact")}
                variant="outline"
                className="border-2 border-foreground text-foreground hover:bg-foreground hover:text-primary-foreground font-semibold px-6 h-12 rounded-lg transition-all duration-300"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
