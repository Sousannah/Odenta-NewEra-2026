import {
  Banknote,
  Briefcase,
  Building2,
  Landmark,
  Pill,
  Sofa,
  Stethoscope,
  User,
  Vault,
  Wallet,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/cn";

/** Icon + colour vocabulary for account pockets, shared by cards and pickers. */
export const ACCOUNT_ICON_COMPONENTS = {
  building: Building2,
  vault: Vault,
  cash: Banknote,
  pill: Pill,
  "tooth-heart": Stethoscope,
  tooth: Stethoscope,
  wallet: Wallet,
  briefcase: Briefcase,
  jar: Landmark,
  tools: Wrench,
  user: User,
  chair: Sofa,
};

export const ACCOUNT_COLOR_HEX = {
  slate: "#64748B",
  blue: "#3EA0F1",
  rose: "#E45689",
  coral: "#EF6F5C",
  amber: "#FCB900",
  green: "#7DD07D",
  teal: "#3ECFB6",
  violet: "#7C5CFC",
  pink: "#E879F9",
  grey: "#94A3B8",
};

export function AccountIcon({ icon = "cash", color = "pink", size = "md", muted = false }) {
  const Icon = ACCOUNT_ICON_COMPONENTS[icon] ?? Banknote;
  const box = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-14 w-14" }[size];
  const glyph = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }[size];

  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-2xl text-white", box)}
      style={{ background: muted ? "#CBD5E1" : (ACCOUNT_COLOR_HEX[color] ?? ACCOUNT_COLOR_HEX.pink) }}
    >
      <Icon className={glyph} strokeWidth={2.2} />
    </span>
  );
}
