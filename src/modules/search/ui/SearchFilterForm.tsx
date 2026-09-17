"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LinkedInAccountListItem } from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { Select } from "@/components/ui/form/Select";
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
      const result = await createSearchDefinitionAction({
        name,
        linkedInAccountId,
        keywords,
        filters,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/searches/${result.id}`);
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="flex flex-col gap-4">
        <ResultTypeTabs />
        <Field label="Search name">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            placeholder="e.g. NYC product managers"
          />
        </Field>
        <Field label="LinkedIn account">
          <Select
            value={linkedInAccountId}
            onChange={(e) => {
              setLinkedInAccountId(e.target.value);
            }}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label} ({account.email})
              </option>
            ))}
          </Select>
        </Field>
        <KeywordsField value={keywords} onChange={setKeywords} />
        <ConnectionDegreeField value={connectionDegree} onChange={setConnectionDegree} />
        <LocationsField
          linkedInAccountId={linkedInAccountId}
          values={locations}
          onChange={setLocations}
        />
        <CurrentCompaniesField
          linkedInAccountId={linkedInAccountId}
          values={currentCompanies}
          onChange={setCurrentCompanies}
        />
        <AllFiltersDrawer />
        <Button
          type="button"
          onClick={submit}
          loading={pending}
          disabled={!name || !linkedInAccountId}
          className="self-start"
        >
          {pending ? "Creating…" : "Create search"}
        </Button>
        {error ? <Alert tone="error">{error}</Alert> : null}
      </CardContent>
    </Card>
  );
}
