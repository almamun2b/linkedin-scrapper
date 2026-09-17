"use client";

import { useState, useTransition } from "react";
import type { FilterRefKind } from "@/generated/prisma/enums";
import type { FilterRefValue } from "../domain/filters";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/form/Field";
import { Input } from "@/components/ui/form/Input";
import { searchFilterRefAction, requestTypeaheadResolutionAction } from "../actions";

export function TypeaheadPicker({
  kind,
  label,
  linkedInAccountId,
  values,
  onChange,
}: {
  kind: FilterRefKind;
  label: string;
  linkedInAccountId: string;
  values: FilterRefValue[];
  onChange: (values: FilterRefValue[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<FilterRefValue[]>([]);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState<string | null>(null);

  function search(q: string) {
    setQuery(q);
    setNote(null);
    startTransition(async () => {
      setMatches(q.trim() ? await searchFilterRefAction(kind, q) : []);
    });
  }

  function add(value: FilterRefValue) {
    if (!values.some((v) => v.urn === value.urn)) onChange([...values, value]);
    setQuery("");
    setMatches([]);
  }

  function remove(urn: string) {
    onChange(values.filter((v) => v.urn !== urn));
  }

  return (
    <Field label={label}>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v.urn} tone="accent">
              {v.label}
              <button
                type="button"
                onClick={() => {
                  remove(v.urn);
                }}
                aria-label={`Remove ${v.label}`}
                className="opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            search(e.target.value);
          }}
          placeholder={`Search cached ${label.toLowerCase()}…`}
        />
        {matches.length > 0 ? (
          <ul className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover py-1 shadow-popover">
            {matches.map((m) => (
              <li key={m.urn}>
                <button
                  type="button"
                  onClick={() => {
                    add(m);
                  }}
                  className="block w-full px-2.5 py-1.5 text-left text-sm hover:bg-surface-muted"
                >
                  {m.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {query.trim() && !pending && matches.length === 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => {
            startTransition(async () => {
              const result = await requestTypeaheadResolutionAction({
                linkedInAccountId,
                kind,
                query,
              });
              setNote(
                result.queued
                  ? "Queued — the worker will resolve this against LinkedIn; search again shortly."
                  : "Already queued this hour.",
              );
            });
          }}
        >
          Search LinkedIn for &quot;{query}&quot;
        </Button>
      ) : null}
      {note ? <Alert tone="info">{note}</Alert> : null}
    </Field>
  );
}
