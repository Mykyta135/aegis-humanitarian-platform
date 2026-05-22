import { MissionWizardSheetClient } from "@/components/dashboard/MissionWizardSheetClient";
import Providers from "@/lib/providers";
import { Toaster } from "sonner";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster richColors />
          <MissionWizardSheetClient />
        </Providers>
      </body>
    </html>
  );
}
