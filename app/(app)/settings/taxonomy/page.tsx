"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Layers, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PackListCard } from "@/components/taxonomy/pack-list-card";
import { ForkDialog } from "@/components/taxonomy/fork-dialog";

interface TaxonomyPack {
  id: string;
  name: string;
  key: string;
  version: string;
  practiceArea: string | null;
  isSystem: boolean;
  parentPackId: string | null;
  categoryCount: number;
  fieldCount: number;
}

async function fetchPacks(): Promise<{ packs: TaxonomyPack[] }> {
  const res = await fetch("/api/taxonomy/packs?includeSystem=true", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch taxonomy packs");
  return res.json();
}

const PRACTICE_AREAS = [
  { key: "all", label: "All" },
  { key: "personal_injury", label: "Personal Injury" },
  { key: "workers_compensation", label: "Workers' Comp" },
  { key: "insurance_defense", label: "Insurance Defense" },
  { key: "litigation", label: "Litigation" },
  { key: "family", label: "Family" },
  { key: "employment", label: "Employment" },
  { key: "conveyancing", label: "Conveyancing" },
  { key: "commercial", label: "Commercial" },
  { key: "criminal", label: "Criminal" },
];

export default function TaxonomySettingsPage() {
  const router = useRouter();
  const [areaFilter, setAreaFilter] = useState("all");
  const [forkPack, setForkPack] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["taxonomy-packs"],
    queryFn: fetchPacks,
    staleTime: 60_000,
  });

  const allPacks = data?.packs || [];
  const filtered =
    areaFilter === "all" ? allPacks : allPacks.filter((p) => p.practiceArea === areaFilter);

  const firmPacks = filtered.filter((p) => !p.isSystem);
  const systemPacks = filtered.filter((p) => p.isSystem);

  const handleForked = (newPackId: string) => {
    refetch();
    router.push(`/settings/taxonomy/${newPackId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Subtle paper texture */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      <div className="relative p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-serif font-light tracking-tight text-amber-50">
              AI Taxonomy
            </h1>
            <span className="text-sm font-mono text-amber-600/60 tracking-wider uppercase">
              Extraction Configuration
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Taxonomy packs control what data the AI extracts from documents. System packs provide
            defaults — customize them to match your firm&apos;s workflow.
          </p>
          <div className="h-[1px] bg-gradient-to-r from-amber-600/40 via-amber-600/10 to-transparent mt-3" />
        </div>

        {/* Practice area filter */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          {PRACTICE_AREAS.map((area) => (
            <button
              key={area.key}
              onClick={() => setAreaFilter(area.key)}
              className={`
                px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${
                  areaFilter === area.key
                    ? "bg-amber-900/40 text-amber-200 border border-amber-800/30"
                    : "bg-slate-800/30 text-slate-400 border border-slate-800/50 hover:bg-slate-800/50"
                }
              `}
            >
              {area.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 bg-slate-800/30" />
            <Skeleton className="h-24 bg-slate-800/30" />
            <Skeleton className="h-24 bg-slate-800/30" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Firm packs */}
            {firmPacks.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-amber-500/60" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-300/80">
                    Your Firm&apos;s Packs
                  </h2>
                  <span className="text-xs text-slate-500">({firmPacks.length})</span>
                </div>
                <div className="space-y-3">
                  {firmPacks.map((pack) => (
                    <PackListCard key={pack.id} pack={pack} />
                  ))}
                </div>
              </section>
            )}

            {/* System packs */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="h-4 w-4 text-blue-400/60" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                  System Packs
                </h2>
                <span className="text-xs text-slate-500">({systemPacks.length})</span>
              </div>
              {systemPacks.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-700/50 rounded-lg">
                  <Layers className="h-8 w-8 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm text-slate-400">
                    No system packs found for this practice area
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {systemPacks.map((pack) => (
                    <PackListCard
                      key={pack.id}
                      pack={pack}
                      onCustomize={(id) => setForkPack({ id, name: pack.name })}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Fork dialog */}
      {forkPack && (
        <ForkDialog
          packId={forkPack.id}
          packName={forkPack.name}
          open={true}
          onOpenChange={(open) => {
            if (!open) setForkPack(null);
          }}
          onForked={handleForked}
        />
      )}
    </div>
  );
}
