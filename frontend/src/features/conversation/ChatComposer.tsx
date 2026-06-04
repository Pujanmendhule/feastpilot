export function ChatComposer() {
  return (
    <textarea
      className="min-h-11 flex-1 resize-none rounded-md border border-input bg-background px-3 py-3 text-sm leading-5 outline-none transition focus:ring-2 focus:ring-ring"
      defaultValue="Can you make this less spicy and add one more dessert?"
      rows={1}
    />
  );
}
