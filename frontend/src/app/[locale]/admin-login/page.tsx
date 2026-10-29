"use client";
"use no memo";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Link from "next/link";
import {
  loginSchema,
  defaultLoginValues,
  LoginFormData,
} from "@/lib/schemas/loginSchema";
import { FrontendAuthService } from "@/services/auth.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { PLATFORM_STAFF_ROLES, UserRole } from "@/types/enums";

// The credential check itself is identical to /login (better-auth resolves
// the account's real role from the database either way) — but this page is
// branded for platform staff specifically, so it actively rejects anyone
// who isn't super_admin/platform_reviewer after a successful sign-in,
// rather than silently letting a company user land on /dashboard from the
// "admin" login. (This page used to show "Administrator"/"Partner" tabs
// that rendered the identical form either way — removed as purely
// decorative; this is the real gate that replaces them.)
export default function LoginPage() {
  const router = useRouter();
  const { locale } = useParams();

  const methods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: defaultLoginValues,
    mode: "onChange",
  });

  const { register, handleSubmit } = methods;

  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    const response = await FrontendAuthService.login({
      email: data.email,
      password: data.password,
    });

    if (!response.success) {
      setIsLoading(false);
      toast.error(
        response.error || "Failed to sign in. Please check your credentials.",
      );
      return;
    }

    const role = response.data?.user?.role as UserRole | undefined;
    if (!role || !PLATFORM_STAFF_ROLES.includes(role)) {
      await FrontendAuthService.signOut();
      setIsLoading(false);
      toast.error(
        "This sign-in is for platform administrators only. Use the regular login page instead.",
      );
      return;
    }

    setIsLoading(false);
    toast.success("Signed in successfully!");
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="min-h-screen flex bg-white w-full">
      {/* Left Panel - Desktop Only */}
      <div className="hidden lg:flex lg:w-7/12 relative bg-luxury-black overflow-hidden group">
        {/* Background Image with slow zoom */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1615747476205-991a14cd2358?q=80&w=765&auto=format&fit=crop"
            alt="Dubai Skyline"
            className="w-full h-full object-cover transition-transform duration-[60s] ease-linear hover:scale-110 opacity-90"
          />
          {/* Dark Vertical Gradient Overlay - Enhanced opacity for readability */}
          <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/40 to-black/80" />
        </div>

        {/* Content - with staggered fadeInUp animation */}
        <div className="relative z-10 p-24 flex flex-col justify-center h-full max-w-2xl">
          <h3 className="text-luxury-gold uppercase tracking-[0.25em] text-xs font-bold mb-6 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
            My Dubai Broker
          </h3>
          <h1 className="text-5xl md:text-6xl font-serif text-white leading-tight mb-8 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards] drop-shadow-lg">
            The pinnacle of luxurious property & asset.
          </h1>
          <div className="w-24 h-0.5 bg-luxury-gold mb-8 opacity-0 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards]" />
          <p className="text-white/90 font-sans text-lg font-light leading-relaxed max-w-md opacity-0 animate-[fadeInUp_0.8s_ease-out_0.8s_forwards]">
            Experience exclusive access to the regions most prestigious real
            estate portfolio. Where luxury meets legacy.
          </p>
        </div>
      </div>

      {/* Right Panel - Form Area */}
      <div className="w-full lg:w-5/12 flex flex-col justify-center items-center p-8 md:p-16 relative bg-white">
        <div className="w-full max-w-md space-y-10 opacity-0 animate-[fadeInUp_1s_ease-out_0.5s_forwards]">
          {/* Header */}
          <div className="text-center space-y-3">
            <h2 className="text-4xl font-serif text-luxury-black tracking-tight">
              MY DUBAI BROKER
            </h2>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 font-semibold">
              Members Only Access
            </p>
          </div>

          {/* Form Inputs */}
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="group space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-sans text-gray-500 font-bold ml-1 transition-colors group-focus-within:text-luxury-gold">
                  Email Credentials
                </label>
                <Input
                  id="email"
                  type="email"
                  label=""
                  placeholder="name@example.com"
                  className="border-gray-200 focus:border-luxury-gold h-14 bg-gray-50/50 focus:bg-white transition-all duration-300"
                  wrapperClassName="mt-0"
                  register={register}
                />
              </div>

              <div className="group space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-sans text-gray-500 font-bold ml-1 transition-colors group-focus-within:text-luxury-gold">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  label=""
                  placeholder="••••••••"
                  className="border-gray-200 focus:border-luxury-gold h-14 bg-gray-50/50 focus:bg-white transition-all duration-300"
                  register={register}
                />
                <div className="text-right">
                  <Link
                    href={`/${locale}/forgot-password`}
                    className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-luxury-gold transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Main Action */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-luxury-black text-white hover:bg-slate-900 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 text-xs tracking-[0.2em] font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  variant="dark"
                >
                  {isLoading ? "SIGNING IN..." : "SECURE ENTRY"}
                </Button>
              </div>
            </form>
          </FormProvider>

          {/* Divider */}
          {/* <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-center">
              <span className="bg-white px-4 text-[10px] uppercase tracking-widest text-gray-400 font-medium">
                Or continue with
              </span>
            </div>
          </div> */}

          {/* Google Button */}
          {/* <button className="w-full h-14 flex items-center justify-center border border-gray-200 bg-white hover:border-luxury-gold hover:bg-orange-50/10 transition-colors duration-300 group shadow-sm hover:shadow-md">
            <GoogleIcon />
            <span className="text-xs font-medium tracking-[0.15em] text-gray-600 group-hover:text-luxury-black uppercase transition-colors">
              Google
            </span>
          </button> */}
        </div>

      </div>
    </div>
  );
}
