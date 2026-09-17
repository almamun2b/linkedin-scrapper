import { AccountForm } from "@/modules/linkedin-account/ui/AccountForm";

export default function NewAccountPage() {
  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-[--color-fg]">Add LinkedIn account</h2>
      <AccountForm />
    </div>
  );
}
