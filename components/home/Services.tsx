"use client";

import { useEffect, useRef } from "react";
import { BookOpen, Heart, Users, GraduationCap, HandHeart } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const services = [
    {
        icon: BookOpen,
        title: "Islamic Education",
        description: "Quran memorization classes, Arabic language instruction, and Islamic studies for all ages.",
    },
    {
        icon: Heart,
        title: "Social Welfare",
        description: "Financial assistance for needy families, marriage assistance, and emergency support.",
    },
    {
        icon: Users,
        title: "Community Events",
        description: "Organizing religious gatherings, lectures, and cultural programs for community bonding.",
    },
    {
        icon: GraduationCap,
        title: "Youth Programs",
        description: "Islamic youth camps, sports activities, and leadership development programs.",
    },
    {
        icon: HandHeart,
        title: "Charitable Activities",
        description: "Qurbani distribution, food assistance, and support for orphan care and widows.",
    },
];

export default function Services() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                titleRef.current,
                { y: 30, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 70%",
                        toggleActions: "play none none reverse",
                    },
                }
            );

            gsap.fromTo(
                cardsRef.current?.children || [],
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: cardsRef.current,
                        start: "top 75%",
                        toggleActions: "play none none reverse",
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section id="services" ref={sectionRef} className="py-20 md:py-32 bg-background">
            <div className="container mx-auto px-4">
                <div ref={titleRef} className="text-center max-w-3xl mx-auto mb-16">
                    <p className="text-muted-foreground font-amiri text-lg tracking-wider mb-2">
                        WHAT WE OFFER
                    </p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                        Our <span className="text-primary">Services</span>
                    </h2>
                    <p className="text-muted-foreground">
                        We provide a range of religious, educational, and social services to serve our
                        community and promote Islamic values and welfare.
                    </p>
                </div>

                <div ref={cardsRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            className="bg-muted rounded-xl p-6 hover:shadow-lg transition-all duration-300 group"
                        >
                            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <service.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">{service.title}</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {service.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
