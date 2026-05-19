import type { Metadata } from "next";
import TextAlignmentClient from "./TextAlignmentClient";

export const metadata: Metadata = {
  title: "Text Alignment",
  description:
    "Read against a reference text and follow the current spoken word in real time.",
  alternates: {
    canonical: "/text-alignment",
  },
};

export default function TextAlignmentPage() {
  return <TextAlignmentClient />;
}
