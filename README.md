# Grid the Grill

Interactive F1 trait-matching board — a centred 6×4 grid of 22 traits plus two free logo
corners, and 22 draggable driver cards from the 2026 grid.
Built with Next.js 16 (App Router) + Tailwind CSS v4, static-rendered, zero runtime deps.

## Play

- **Drag** a driver card from the paddock onto the trait you think matches them.
- Or **tap** a card, then tap a square (the board scrolls into view on mobile).
- Drop a card on an occupied square to swap; drag it back to the paddock to remove it.
- Each driver can only sit on one trait — 22 drivers, 22 traits.
- **Shuffle paddock** reorders the cards, **Clear board** returns everyone, **Copy grid**
  puts your trait → driver list on the clipboard.
- Progress + timer persist in `localStorage`.

There is no built-in answer key: the app never claims which driver a trait "really"
belongs to. Supply a key and it can be scored.

## Local

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Deploy to Vercel

No config needed — Vercel auto-detects Next.js.

```bash
npx vercel        # preview
npx vercel --prod # production
```

Or push the repo to GitHub and hit **Import Project** at vercel.com.

## Structure

| Path | Purpose |
|---|---|
| `lib/board.ts` | Trait text + captions for the 24 squares |
| `lib/drivers.ts` | 2026 drivers, numbers, teams and team colours |
| `components/BingoGame.tsx` | Drag/drop state, placement rules, timer, persistence |
| `components/DriverCard.tsx` | Driver card + the compact chip shown on a square |
| `components/TeamBadge.tsx` | Original geometric team mark (not an official logo) |
| `components/Confetti.tsx` | Dependency-free canvas confetti |
| `components/GridLogo.tsx` | Corner free-square mark |
| `app/globals.css` | Theme tokens, keyframes, container-query type scale |

Fan-made. Not affiliated with Formula 1.
