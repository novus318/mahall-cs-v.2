"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, HandHeart, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import api from "@/lib/axios";
import { toast } from "sonner";

const presetAmounts = [100, 250, 500, 1000, 2500, 5000];

export default function DonationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    amount: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    if (selectedAmount && id === "amount") {
      setSelectedAmount(null);
    }
    if (error) setError(null);
  };

  const handlePresetAmount = (amount: number) => {
    setSelectedAmount(amount);
    setFormData({ ...formData, amount: amount.toString() });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.amount || !formData.name || !formData.number) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid donation amount");
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.post("/donation", {
        name: formData.name,
        number: formData.number,
        amount: amount,
      });

      if (data.status) {
        setSuccess(true);
        toast.success("Thank you for your donation!");
      }
    } catch (error: any) {
      console.error(error);
      const message =
        error.response?.data?.message || "Failed to process donation";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="max-w-md w-full text-center py-8">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800">Thank You!</h2>
            <p className="text-muted-foreground">
              Your donation has been received successfully. May Allah reward you
              abundantly for your generosity.
            </p>
            <Button
              onClick={() => {
                setSuccess(false);
                setFormData({ name: "", number: "", amount: "" });
                setSelectedAmount(null);
              }}
              variant="outline"
              className="mt-4"
            >
              Donate Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="size-6" />
            </div>
            <span className="text-xl font-semibold">TMJ</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/login")}>
              Login
            </Button>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
              <Heart className="h-4 w-4 fill-current" />
              Support Our Community
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-gray-900">
              Your{" "}
              <span className="text-green-600">Generosity</span> Makes a
              Difference
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Your donation helps us serve the community, maintain our
              facilities, and support those in need. Every contribution counts.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HandHeart className="h-5 w-5 text-green-600" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span>Transparent Process</span>
              </div>
            </div>
          </div>

          <Card className="shadow-xl py-3">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Make a Donation</CardTitle>
              <CardDescription>
                Your support means the world to us
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="amount">Donation Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={formData.amount}
                      onChange={handleChange}
                      min="1"
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                      {presetAmounts.map((amount) => (
                        <Button
                          key={amount}
                          type="button"
                          variant={selectedAmount === amount ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePresetAmount(amount)}
                        >
                          ₹{amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name">Your Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="number">Phone Number</Label>
                    <Input
                      id="number"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.number}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Donate Now"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground pt-2">
                    By donating, you agree to our terms and conditions
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        Mahall Management System &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
