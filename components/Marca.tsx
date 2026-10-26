import { DraftingCompass } from "lucide-react";

export function MarcaIc({ size = 18 }: { size?: number }) {
  return (
    <span className="marca-ic">
      <DraftingCompass size={size} strokeWidth={2.3} />
    </span>
  );
}
