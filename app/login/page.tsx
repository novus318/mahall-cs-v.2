"use client"
import { LoginForm } from "@/components/login-form"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MapPin } from "lucide-react"

export default function Page() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      router.push('/dashboard')
    } else {
      setIsChecking(false)
    }
  }, [router])

  if (isChecking) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid min-h-svh w-full bg-background lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex">
        <img
          src="/mousque.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/85 to-primary" />
        <div className="absolute inset-0 pattern-dots text-primary-foreground opacity-10" />
        <div
          className="absolute bottom-1/3 right-16 h-24 w-24 rotate-12 border border-primary-foreground/20 animate-rotate-slow opacity-40"
          style={{ animationDirection: "reverse" }}
        />
        <div className="absolute right-10 top-1/4 h-16 w-16 animate-float rounded-full border-2 border-primary-foreground/10" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
         <img
              src="/logo-white.png"
              alt="Thayineri Muslim Jama-ath Committee"
              className="h-12 w-auto xl:h-14"
            />
            <div className="pt-2">
              <p className="font-semibold leading-tight">THAYINERI MUSLIM</p>
              <p className="text-sm text-primary-foreground/70">JAMA-ATH COMMITTEE</p>
            </div>
          </div>

          <div className="max-w-md">
            <span className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
              Welcome
            </span>
            <h2 className="mt-6 text-4xl font-bold leading-tight xl:text-5xl">
              Managing our Mahall, together.
            </h2>
            <p className="mt-4 text-primary-foreground/70">
              One secure place for membership, contributions, rent, and everything our
              community needs.
            </p>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-accent" />
              Payyanur, Kannur, Kerala
            </div>
            <p className="text-xs text-primary-foreground/60">
              © {new Date().getFullYear()} Thayineri Muslim Jama-ath Committee. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex min-h-svh flex-col bg-background">
        <header className="flex items-center gap-3 border-b border-border px-3 py-2 lg:hidden">
         <img
              src="/logo.png"
              alt="Thayineri Muslim Jama-ath Committee"
              className="h-12 w-auto xl:h-14"
            />
           <div className="pt-2">
              <p className="font-semibold leading-tight">THAYINERI MUSLIM</p>
              <p className="text-sm">JAMA-ATH COMMITTEE</p>
            </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </main>
      </div>
    </div>
  )
}
