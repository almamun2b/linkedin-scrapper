"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LinkedInAccountListItem } from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { Button } from "@/ui/Button";
import type { ConnectionDegree, FilterRefValue, SearchFilters } from "../domain/filters";
import { createSearchDefinitionAction } from "../actions";
import { ResultTypeTabs } from "./ResultTypeTabs";
import { KeywordsField } from "./filters/KeywordsField";
import { ConnectionDegreeField } from "./filters/ConnectionDegreeField";
import { LocationsField } from "./filters/LocationsField";
import { CurrentCompaniesField } from "./filters/CurrentCompaniesField";
import { AllFiltersDrawer } from "./AllFiltersDrawer";

export function SearchFilterForm({ accounts }: { accounts: LinkedInAccountListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [linkedInAccountId, setLinkedInAccountId] = useState(accounts[0]?.id ?? "");
  const [keywords, setKeywords] = useState("");
  const [connectionDegree, setConnectionDegree] = useState<ConnectionDegree[]>([]);
  const [locations, setLocations] = useState<FilterRefValue[]>([]);
  const [currentCompanies, setCurrentCompanies] = useState<FilterRefValue[]>([]);

  function submit() {
    setError(null);
    const filters: SearchFilters = { keywords, connectionDegree, locations, currentCompanies };
    startTransition(async () => {
      const result = await createSearchDefinitionAction({ name, linkedInAccountId, keywords, filters });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/searches/${result.id}`);
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4 rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] p-4">
      <ResultTypeTabs />
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        Search name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. NYC product managers"
          className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-[--color-muted]">
        LinkedIn account
        <select
          value={linkedInAccountId}
          onChange={(e) => setLinkedInAccountId(e.target.value)}
          className="rounded-md border border-[--color-border] bg-transparent px-2 py-1.5 text-sm"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.label} ({account.email})
            </option>
          ))}
        </select>
      </label>
      <KeywordsField value={keywords} onChange={setKeywords} />
      <ConnectionDegreeField value={connectionDegree} onChange={setConnectionDegree} />
      <LocationsField linkedInAccountId={linkedInAccountId} values={locations} onChange={setLocations} />
      <CurrentCompaniesField linkedInAccountId={linkedInAccountId} values={currentCompanies} onChange={setCurrentCompanies} />
      <AllFiltersDrawer />
      <Button type="button" onClick={submit} disabled={pending || !name || !linkedInAccountId} className="self-start">
        {pending ? "Creating…" : "Create search"}
      </Button>
      {error ? <p className="text-sm text-[--color-danger]">{error}</p> : null}
    </div>
  );
}
