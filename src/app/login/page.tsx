"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError("Nieprawidłowy email lub hasło");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Sprawdź swoją skrzynkę e-mail, aby potwierdzić rejestrację.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-white px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="text-4xl font-bold text-primary">
            Treatly <span className="text-2xl">✨</span>
          </div>
          <CardTitle className="text-xl">
            {isLogin ? "Zaloguj się" : "Zarejestruj się"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Wprowadź dane, aby uzyskać dostęp do swojego salonu"
              : "Stwórz konto, aby zacząć zarządzać swoim salonem"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jan@salon.pl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {message && (
              <p className="text-sm text-green-600">{message}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Ładowanie..."
                : isLogin
                ? "Zaloguj się"
                : "Zarejestruj się"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? "Nie masz konta?" : "Masz już konto?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setMessage("");
              }}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "Zarejestruj się" : "Zaloguj się"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
