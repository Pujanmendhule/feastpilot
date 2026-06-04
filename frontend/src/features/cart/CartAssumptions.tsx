type CartAssumptionsProps = {
  assumptions: string[];
};

export function CartAssumptions({ assumptions }: CartAssumptionsProps) {
  return (
    <section className="mt-4 rounded-md border border-border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold">Assumptions</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {assumptions.map((assumption) => (
          <li className="leading-5" key={assumption}>
            {assumption}
          </li>
        ))}
      </ul>
    </section>
  );
}
