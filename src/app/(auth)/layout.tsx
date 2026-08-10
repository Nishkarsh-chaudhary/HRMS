import Link from "next/link";
import { Building2, CheckCircle2, Fingerprint, IndianRupee, Users } from "lucide-react";

const highlights = [
  {
    icon: Users,
    title: "One connected workplace",
    text: "Employees, teams and reporting lines in one secure organisation.",
  },
  {
    icon: Fingerprint,
    title: "Biometric-ready",
    text: "Adapter-based sync for any attendance device.",
  },
  {
    icon: IndianRupee,
    title: "India-first payroll",
    text: "PF, ESI, TDS and professional tax built in.",
  },
];

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-[#1b84e8]/20 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/40">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-bold tracking-tight text-white">HRMS</span>
            <span className="text-xs font-medium text-sidebar-foreground">
              Human Resources Platform
            </span>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-black">
            Run your entire HR operations from one place.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-sidebar-foreground">
            Attendance, leave, employees and payroll for your organisation —
            connected through one secure workspace.
          </p>
          <ul className="mt-8 space-y-5">
            {highlights.map((h) => (
              <li key={h.title} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent">
                  <h.icon className="h-[18px] w-[18px] text-primary" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{h.title}</p>
                  <p className="text-[13px] text-sidebar-foreground">{h.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-sidebar-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Trusted by growing teams across India
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col bg-white lg:w-1/2">
        <div className="flex justify-end p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </span>
            <span className="text-base font-bold text-foreground">HRMS</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-10 lg:px-16">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="pb-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} HRMS Platform. All rights reserved.
        </p>
      </div>
    </div>
  );
}
