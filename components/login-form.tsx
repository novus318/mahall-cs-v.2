"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/axios"
import { toast } from "sonner"
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"

const inputClasses =
  "h-auto rounded-none border-0 border-b-2 border-input bg-transparent px-0 py-3 text-base shadow-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-0 md:text-base"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await api.post('/auth/login', formData);

      localStorage.setItem('accessToken', data.data?.accessToken);
      localStorage.setItem('refreshToken', data.data?.refreshToken);
      localStorage.setItem('user', JSON.stringify({
        username: data.data?.username,
        role: data.data?.role,
        _id: data.data?._id
      }));

      toast.success("Logged in successfully");
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col", className)} {...props}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <span className="inline-flex h-6 w-fit items-center rounded-full bg-accent px-3 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
        Secure Login
      </span>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Welcome back
      </h1>
      <p className="mt-2 text-muted-foreground">
        Sign in to continue to the Mahall Management System.
      </p>

      <form onSubmit={handleLogin} className="mt-8 flex flex-col gap-6">
        <div className="grid gap-1.5">
          <Label htmlFor="username" className="text-sm font-medium">
            Username
          </Label>
          <Input
            id="username"
            type="text"
            placeholder="Enter your username"
            required
            autoComplete="username"
            className={inputClasses}
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <button
              type="button"
              onClick={() => toast.info("Please contact admin to reset password")}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className={cn(inputClasses, "pr-10")}
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full rounded-lg text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        THAYINERI MUSLIM JAMA-ATH COMMITTEE · Mahall Management System
      </div>
    </div>
  )
}
