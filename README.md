# FRCBetterStats

FRCBetterStats is a Vite + React + TypeScript SPA for exploring FIRST Robotics Competition event rankings, match results, team profiles, and charts using The Blue Alliance API v3.

## TBA API Key

1. Create or sign in to a The Blue Alliance account at [thebluealliance.com/account](https://www.thebluealliance.com/account).
2. Generate a Read API key from the account page.
3. Copy `.env.example` to `.env` and add your key:

```bash
VITE_TBA_API_KEY=your_tba_api_key_here
```

## Local Development

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build

```bash
npm run build
```

The production build is emitted to `dist`, which is compatible with Vercel static deployments.

## Deploy To Vercel

1. Import this repository in Vercel.
2. Set the environment variable `VITE_TBA_API_KEY` in Project Settings.
3. Use the default Vite settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy.

## Notes

All API requests are made directly to The Blue Alliance API v3 from the browser and include the `X-TBA-Auth-Key` header configured in `src/api/tba.ts`.
