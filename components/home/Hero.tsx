"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import gsap from "gsap";

export default function Hero() {
    const heroRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const descRef = useRef<HTMLParagraphElement>(null);
    const buttonsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            const titleChars = titleRef.current?.querySelectorAll(".char");
            if (titleChars) {
                gsap.fromTo(
                    titleChars,
                    { y: 100, opacity: 0, rotateX: 90 },
                    {
                        y: 0,
                        opacity: 1,
                        rotateX: 0,
                        duration: 1.2,
                        stagger: 0.03,
                        ease: "power3.out",
                        delay: 0.3,
                    }
                );
            }

            gsap.fromTo(
                subtitleRef.current,
                { opacity: 0, width: 0 },
                { opacity: 1, width: "100%", duration: 1, delay: 0.8, ease: "power2.out" }
            );

            gsap.fromTo(
                descRef.current,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, delay: 1.2, ease: "power3.out" }
            );

            gsap.fromTo(
                buttonsRef.current?.children || [],
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    stagger: 0.15,
                    delay: 1.5,
                    ease: "power3.out",
                }
            );
        }, heroRef);

        return () => ctx.revert();
    }, []);

    const splitText = (text: string) => {
        return text.split("").map((char, index) => (
            <span
                key={index}
                className="char inline-block"
                style={{ display: char === " " ? "inline" : "inline-block" }}
            >
                {char === " " ? "\u00A0" : char}
            </span>
        ));
    };

    const scrollToSection = (href: string) => {
        const element = document.querySelector(href);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <section
            id="home"
            ref={heroRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
            <div className="hero-bg absolute inset-0 z-0">
                <img
                    src="/mousque.jpg"
                    alt="Beautiful Mosque"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/45" />
                <div className="absolute inset-0 pattern-dots opacity-10" />
            </div>

            <div className="absolute top-20 left-10 w-32 h-32 border border-white/20 rotate-45 animate-rotate-slow opacity-30" />
            <div className="absolute bottom-40 right-20 w-24 h-24 border border-white/20 rotate-12 animate-rotate-slow opacity-20" style={{ animationDirection: "reverse" }} />
            <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-white/10 rounded-full animate-float" />

            <div className="relative z-10 container mx-auto px-4 pt-20">
                <div className="max-w-4xl mx-auto text-center">
                    <p
                        ref={subtitleRef}
                        className="text-white/60 text-base sm:text-lg md:text-xl mb-5 tracking-[0.3em] overflow-hidden whitespace-nowrap"
                    >
                        WELCOME TO
                    </p>

                    <h1
                        ref={titleRef}
                        className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight perspective-1000"
                    >
                        <span className="block">{splitText("THAYINERI")}</span>
                        <span className="block text-white/75 mt-2">{splitText("MUSLIM JAMA-ATH")}</span>
                        <span className="block text-xl sm:text-2xl md:text-3xl lg:text-4xl mt-3 font-normal tracking-widest text-white/60">{splitText("COMMITTEE")}</span>
                    </h1>


                    <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center items-stretch sm:items-center">
                        <Button
                            onClick={() => scrollToSection("#about")}
                            className="h-12 sm:h-12 rounded-lg bg-transparent border-2 border-white text-white hover:bg-white hover:text-foreground font-semibold px-8 text-base transition-all duration-300 group"
                        >
                            Learn More
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            onClick={() => scrollToSection("#contact")}
                            className="h-12 sm:h-12 rounded-lg bg-white text-foreground hover:bg-muted font-semibold px-8 text-base transition-all duration-300"
                        >
                            <Phone className="w-5 h-5 mr-2" />
                            Contact Us
                        </Button>
                    </div>

                    <div className="mt-10 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/20">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-white/90 text-sm">Payyanur, Kannur, Kerala</span>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                <button
                    onClick={() => scrollToSection("#about")}
                    className="flex flex-col items-center text-white/60 hover:text-white transition-colors duration-300"
                >
                    <span className="text-xs mb-2 tracking-wider">SCROLL DOWN</span>
                    <ChevronDown className="w-6 h-6 animate-bounce" />
                </button>
            </div>
        </section>
    );
}
