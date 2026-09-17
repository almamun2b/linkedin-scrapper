import { notFound } from "next/navigation";
import * as searchRepo from "@/modules/search/repository/searchDefinition.repository";
import * as accountRepo from "@/modules/linkedin-account/repository/linkedInAccount.repository";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { DescriptionList } from "@/components/ui/DescriptionList";
import { PageHeader } from "@/components/ui/PageHeader";
import { archiveSearchDefinitionAction } from "@/modules/search/actions";
import { RunNowButton } from "@/modules/search/ui/RunNowButton";

export default async function SearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const definition = await searchRepo.findById(id);
  if (!definition) notFound();
  const account = await accountRepo.findById(definition.linkedInAccountId);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <PageHeader
        title={definition.name}
        description={`LinkedIn account: ${account?.label ?? "unknown"}`}
        actions={
          <>
            <RunNowButton searchDefinitionId={definition.id} />
            <form action={archiveSearchDefinitionAction}>
              <input type="hidden" name="id" value={definition.id} />
              <Button type="submit" variant="danger">
                Archive
              </Button>
            </form>
          </>
        }
      />

      <DescriptionList
        items={[
          { key: "keywords", label: "Keywords", value: definition.keywords ?? "—" },
          { key: "maxPages", label: "Max pages", value: definition.maxPages },
        ]}
      />

      <Card>
        <CardContent>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Filters (raw)</p>
          <pre className="overflow-x-auto rounded-md bg-surface-muted p-3 text-xs">
            {JSON.stringify(definition.filters, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
