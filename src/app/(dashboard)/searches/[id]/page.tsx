import { notFound } from "next/navigation";
import * as searchRepo from "@/modules/search/repository/searchDefinition.repository";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { Button } from "@/ui/Button";
import { archiveSearchDefinitionAction } from "@/modules/search/actions";
import { RunNowButton } from "@/modules/search/ui/RunNowButton";

export default async function SearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const definition = await searchRepo.findById(id);
  if (!definition) notFound();
  const account = await accountRepo.findById(definition.linkedInAccountId);

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-lg font-semibold text-[--color-fg]">{definition.name}</h1>
        <p className="text-sm text-[--color-muted]">LinkedIn account: {account?.label ?? "unknown"}</p>
      </div>

      <div className="rounded-[--radius-card] border border-[--color-border] bg-[--color-surface] p-4 text-sm">
        <p>
          <span className="text-[--color-muted]">Keywords:</span> {definition.keywords ?? "—"}
        </p>
        <p>
          <span className="text-[--color-muted]">Max pages:</span> {definition.maxPages}
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-[--color-bg] p-2 text-xs">
          {JSON.stringify(definition.filters, null, 2)}
        </pre>
      </div>

      <div className="flex gap-3">
        <RunNowButton searchDefinitionId={definition.id} />
        <form action={archiveSearchDefinitionAction}>
          <input type="hidden" name="id" value={definition.id} />
          <Button type="submit" variant="danger">
            Archive
          </Button>
        </form>
      </div>
    </div>
  );
}
