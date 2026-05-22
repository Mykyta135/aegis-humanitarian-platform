"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/stores/use-auth.store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import Link from "next/link";
import { Shield, Users, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_SKILLS = ["medic", "driver", "translator", "coordinator", "electrician", "mechanic", "cook", "engineer"];
const ALL_LANGUAGES = ["ukrainian", "english", "polish", "german", "french"];

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  languages: z.array(z.string()).min(1, "Select at least one language"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setToken } = useAuthStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      skills: [],
      languages: [],
    },
  });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      email: values.email,
      password: values.password,
      skills: values.skills,
      languages: values.languages,
    };
    console.log("[Register] onSubmit called with payload:", payload);
    try {
      const response = await api.post("/auth/register", payload);
      setToken(response.data.access_token);
      router.push("/");
    } catch (error: any) {
      const msg = error.response?.data?.message ?? "Registration failed. Please try again.";
      toast.error(msg);
    }
  };

  const onValidationError = (errors: any) => {
    console.error("[Register] Validation errors:", errors);
    toast.error("Please fix the form errors before submitting.");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-primary p-10 text-primary-foreground">
        <div className="flex items-center gap-2">
          <Shield className="h-7 w-7" />
          <span className="text-2xl font-bold tracking-tight">Aegis</span>
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Join the humanitarian mission coordination platform.
          </h2>
          <div className="space-y-4">
            {[
              { icon: Users, text: "Connect with coordination teams" },
              { icon: Zap, text: "Get assigned to missions matching your skills" },
              { icon: Shield, text: "Real-time mission tracking and comms" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-primary-foreground/90">
                <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-primary-foreground/60">
          Aegis Humanitarian Coordination Platform © 2025
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-8">
          <div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onValidationError)} className="space-y-5">
              {/* Account details */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Account</p>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input placeholder="you@example.com" type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl><Input type="password" placeholder="Min. 8 chars" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl><Input type="password" placeholder="Repeat password" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Skills</p>
                <FormField control={form.control} name="skills" render={() => (
                  <FormItem>
                    <FormDescription>Select all that apply</FormDescription>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ALL_SKILLS.map((skill) => {
                        const checked = form.watch("skills").includes(skill);
                        return (
                          <Badge
                            key={skill}
                            variant={checked ? "default" : "outline"}
                            className="cursor-pointer capitalize select-none"
                            onClick={() => {
                              const cur = form.getValues("skills");
                              form.setValue(
                                "skills",
                                checked ? cur.filter((s) => s !== skill) : [...cur, skill],
                                { shouldValidate: true }
                              );
                            }}
                          >
                            {skill}
                          </Badge>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Languages */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Languages</p>
                <FormField control={form.control} name="languages" render={() => (
                  <FormItem>
                    <FormDescription>Languages you can communicate in</FormDescription>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {ALL_LANGUAGES.map((lang) => (
                        <div key={lang} className="flex items-center gap-2">
                          <Checkbox
                            id={`lang-${lang}`}
                            checked={form.watch("languages").includes(lang)}
                            onCheckedChange={(checked) => {
                              const cur = form.getValues("languages");
                              form.setValue(
                                "languages",
                                checked ? [...cur, lang] : cur.filter((l) => l !== lang),
                                { shouldValidate: true }
                              );
                            }}
                          />
                          <label htmlFor={`lang-${lang}`} className="text-sm capitalize cursor-pointer">
                            {lang}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={form.formState.isSubmitting}
                onClick={() => form.handleSubmit(onSubmit, onValidationError)()}
              >
                {form.formState.isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
