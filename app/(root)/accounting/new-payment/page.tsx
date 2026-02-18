import { submitPaymentFromForm } from "@/lib/actions/payment.actions";

type Props = {
  searchParams: Promise<{
    userId?: string;
    amountCents?: string;
  }>;
};

export default async function NewPaymentPage({ searchParams }: Props) {
  const params = await searchParams;
  const userId = params.userId ?? "";
  const suggestedAmount = params.amountCents
    ? (Number(params.amountCents) / 100).toFixed(2)
    : "";

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">New Payment</h1>

      <form
        action={submitPaymentFromForm}
        className="space-y-4 rounded-md border p-4"
      >
        <input type="hidden" name="userId" value={userId} />

        <div>
          <label className="mb-1 block text-sm font-medium">Amount</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={suggestedAmount}
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Method</label>
          <select
            name="method"
            defaultValue="CASH"
            className="w-full rounded border px-3 py-2"
          >
            <option value="CASH">Cash</option>
            <option value="VISA">Visa</option>
            <option value="TRANSFER">Transfer</option>
            <option value="EURO">Euro</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Discount</label>
          <input
            name="discount"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Reference</label>
          <input
            name="reference"
            type="text"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Save payment
        </button>
      </form>
    </main>
  );
}
