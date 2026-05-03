import { getAssets } from "@/app/actions/assets";
import { AssetsClient } from "@/components/assets/AssetsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assets | Operation Sparta",
  description: "Manage and view all your generated and uploaded media.",
};

export default async function AssetsPage() {
  const assets = await getAssets();

  return (
    <main className="max-w-(--breakpoint-2xl) mx-auto p-4 md:p-8">
      <AssetsClient initialAssets={assets} />
    </main>
  );
}
