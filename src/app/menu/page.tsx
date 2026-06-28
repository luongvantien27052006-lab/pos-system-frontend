import { CustomerApp } from './customer-app';

export default function MenuPage({
  searchParams,
}: {
  searchParams: { table?: string };
}) {
  const table = (searchParams.table ?? '').trim();

  if (!table) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-8 text-center text-muted-foreground">
        Thiếu số bàn trong đường dẫn. Vui lòng quét lại mã QR trên bàn.
      </main>
    );
  }

  return <CustomerApp tableNumber={table} />;
}