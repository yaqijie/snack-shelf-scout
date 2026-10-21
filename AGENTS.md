<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All app data reads/writes go through `src/lib/store.ts` (currently localStorage); swap its load/save/actions for a cloud DB later instead of touching pages.
- Inventory is Product + separate Batch records; never merge batches, each keeps its own expiry date.
- Pure business rules (pickup deduction, allergy check, expiry status) live in `src/lib/inventory-rules.ts` / `src/lib/expiry.ts` with tests in `src/test/`.
