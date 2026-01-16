// src/components/LoginPage.tsx
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "./ui/input-otp";
import { ArrowLeft, Shield, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/64732130af5e1351819c7a94a0f8563f43705c92.png";
import { authService } from "../services/authService";
import { getTempToken, clearTempToken, getTempTokenRemainingSeconds } from "../services/tokenStorage";

interface LoginPageProps {
  onLogin: (user?: any) => void;
}

// Générer un deviceId unique pour cette session
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
};

// Obtenir les informations du device pour le login - FORMAT EXACT POSTMAN
const getDeviceInfoForLogin = () => {
  const deviceId = getDeviceId();
  
  // FORMAT EXACT comme dans Postman
  const deviceInfo = {
    deviceId: deviceId,
    deviceType: "MOBILE" as const,
    deviceModel: "iPhone de Mac", // Même valeur que Postman
    osName: "tester", // Même valeur que Postman
  };
  
  console.log('[DeviceInfo Login]', deviceInfo);
  return deviceInfo;
};

// Obtenir les informations du device pour verify-otp - FORMAT EXACT POSTMAN
const getDeviceInfoForVerifyOtp = () => {
  const deviceId = getDeviceId();
  
  // FORMAT EXACT comme dans Postman pour verify-otp
  const deviceInfo = {
    deviceId: deviceId,
    deviceType: "MOBILE" as const,
    deviceModel: "iPhone de Mac", // deviceName (pas deviceModel) avec même valeur
    osName: "tester", // Même valeur que Postman
  };
  
  console.log('[DeviceInfo VerifyOTP]', deviceInfo);
  return deviceInfo;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Veuillez entrer votre email ou téléphone");
      return;
    }

    setIsLoading(true);
    try {
      const deviceInfo = getDeviceInfoForLogin();
      const loginRequest = {
        contact: email.trim(),
        deviceInfo: deviceInfo,
      };
      
      console.log("[Login] Request payload:", JSON.stringify(loginRequest, null, 2));
      
      const response = await authService.login(loginRequest);

      // authService.login stocke désormais le tempToken (et l'expiration si fournie)
      console.log("[Login] Response:", response);

      // Transitionner vers OTP seulement si on a bien reçu le temp token
      const temp = getTempToken();
      if (!temp) {
        throw new Error('Aucun token temporaire reçu. Le code n\'a pas été envoyé.');
      }

      // mettre à jour le timer si l'expiration est connue
      const remaining = getTempTokenRemainingSeconds();
      if (remaining !== null) setRemainingSeconds(remaining);

      setStep('otp');
      toast.success("Code de vérification envoyé !");
    } catch (error) {
      console.error("Login error:", error);
      const msg = error instanceof Error ? error.message : "Erreur lors de l'envoi du code. Veuillez réessayer.";

      // Si erreur serveur (500) mais OTP a pu être envoyé côté backend, permettre à l'utilisateur
      // d'entrer le code en allant quand même à l'écran OTP. On initialise un timer par défaut.
      const isServerError = /500|Erreur serveur/i.test(msg);
      if (isServerError) {
        console.warn('[LoginPage] Server error on login; falling back to OTP screen');
        // démarrer le timer par défaut (10 minutes)
        setRemainingSeconds(10 * 60);
        setStep('otp');
        toast.info("Erreur serveur lors de l'envoi, mais le code peut avoir été envoyé. Entrez votre code OTP.");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = async (value: string) => {
    setOtp(value);
    // Vérifier automatiquement quand les 5 chiffres sont entrés
    if (value.length === 5) {
      await verifyOtp(value);
    }
  };

  const verifyOtp = async (otpCode: string) => {
    const tempToken = getTempToken();
    if (!tempToken) {
      toast.error("Session expirée. Veuillez recommencer.");
      setStep("email");
      return;
    }

    // Check remaining seconds before attempting verify
    const remaining = getTempTokenRemainingSeconds();
    if (remaining !== null && remaining <= 0) {
      toast.error('Code expiré. Veuillez renvoyer le code.');
      return;
    }

    setIsLoading(true);
    try {
      const deviceInfo = getDeviceInfoForVerifyOtp();
      const verifyRequest = {
        // contact: email.trim(),
        otpCode: otpCode,
        tempToken: tempToken,
        deviceInfo: deviceInfo,
      };
      
      console.log("[Verify OTP] Request payload:", JSON.stringify(verifyRequest, null, 2));
      
      const response = await authService.verifyOtp(verifyRequest);

      clearTempToken();
      console.log("[Verify OTP] Success! Access token:", response.accessToken?.substring(0, 20) + "...");
      
      toast.success("Connexion réussie !");
      setTimeout(() => {
        onLogin(response.user);
      }, 500);
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Code OTP incorrect. Veuillez réessayer."
      );
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      clearTempToken();
      const deviceInfo = getDeviceInfoForLogin();
      const response = await authService.login({
        contact: email.trim(),
        deviceInfo: deviceInfo,
      });
      const temp = getTempToken();
      if (!temp) {
        throw new Error('Échec du renvoi du code. Aucun token reçu.');
      }

      const remaining = getTempTokenRemainingSeconds();
      if (remaining !== null) setRemainingSeconds(remaining);
      setStep('otp');
      toast.success("Code renvoyé !");
      setOtp("");
    } catch (error) {
      console.error("Resend code error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors du renvoi du code. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep("email");
    setOtp("");
  };

  // countdown for OTP expiration
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => getTempTokenRemainingSeconds());

  useEffect(() => {
    if (step !== 'otp') return;
    let mounted = true;
    const tick = () => {
      const r = getTempTokenRemainingSeconds();
      if (!mounted) return;
      setRemainingSeconds(r);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => { mounted = false; clearInterval(id); };
  }, [step]);

  const formatSeconds = (s: number) => {
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
      {/* Language Selector - Top Right */}
      {step === "email" && (
        <div className="absolute top-6 right-6 flex items-center gap-2 text-sm text-gray-600">
          <Globe className="h-4 w-4" />
          <span>FR Français</span>
        </div>
      )}

      {/* Back Button - Top Left (only on OTP page) */}
      {step === "otp" && (
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          style={{ display: step === "otp" ? "block" : "none", cursor: "pointer"}}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </button>
      )}

      <div className="w-full max-w-md">
        {step === "email" ? (
          // Login Page
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="rounded-2xl shadow-lg">
                <img src={logo} alt="Logo" className="w-16 h-16 rounded-2xl object-cover" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl text-gray-900">Bienvenue</h1>
              <p className="text-gray-600">Connectez-vous à votre dashboard</p>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email ou Téléphone
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="nom@example.com ou +237623456789"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-gray-50 border-gray-200"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#6b7280] hover:bg-[#4b5563] text-white rounded-lg"
                disabled={isLoading}
                style={{ cursor: isLoading ? "not-allowed" : "pointer"}}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>

              <p className="text-sm text-center text-gray-500">
                Un code de vérification sera envoyé à votre email ou téléphone
              </p>
            </form>
          </div>
        ) : (
          // OTP Verification Page
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Security Icon */}
            <div className="flex justify-center">
              <div className="bg-[#1e3a5f] rounded-2xl p-5 shadow-lg">
                <Shield className="w-10 h-10 text-yellow-400" strokeWidth={2} />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl text-gray-900">Vérification</h1>
              <p className="text-gray-600">
                Entrez le code envoyé à
              </p>
              <p className="text-gray-900 font-medium">{email}</p>
              {remainingSeconds !== null && (
                <p className="text-sm text-gray-500">Code expire dans {formatSeconds(remainingSeconds)}</p>
              )}
            </div>

            {/* OTP Input */}
            <div className="space-y-6 py-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={5}
                  value={otp}
                  onChange={handleOtpChange}
                  disabled={isLoading}
                >
                  <InputOTPGroup className="gap-3">
                    <InputOTPSlot 
                      index={0} 
                      className="w-12 h-14 text-xl border-2 border-gray-300 rounded-xl data-[state=active]:border-[#6b7280]"
                    />
                    <InputOTPSlot 
                      index={1} 
                      className="w-12 h-14 text-xl border-2 border-gray-300 rounded-xl data-[state=active]:border-[#6b7280]"
                    />
                    <InputOTPSlot 
                      index={2} 
                      className="w-12 h-14 text-xl border-2 border-gray-300 rounded-xl data-[state=active]:border-[#6b7280]"
                    />
                    <InputOTPSlot 
                      index={3} 
                      className="w-12 h-14 text-xl border-2 border-gray-300 rounded-xl data-[state=active]:border-[#6b7280]"
                    />
                    <InputOTPSlot 
                      index={4} 
                      className="w-12 h-14 text-xl border-2 border-gray-300 rounded-xl data-[state=active]:border-[#6b7280]"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="button"
                className="w-full h-12 bg-[#6b7280] hover:bg-[#4b5563] text-white rounded-lg"
                onClick={() => verifyOtp(otp)}
                disabled={otp.length !== 5 || isLoading || (remainingSeconds !== null && remainingSeconds <= 0)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  "Vérifier"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-[#8b68a6] hover:text-[#6b4685] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Envoi en cours..." : "Renvoyer le code"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}