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
- All UI data access goes through `src/lib/store.ts`. Shared profiles, replies and settings use server functions backed by Supabase; browser storage remains only as a legacy import source. Recipient progress and unsent replies are temporary React state.
- `/admin` uses server-verified shared-password encrypted HttpOnly sessions. Every private server API must independently require the admin session. Supabase secrets stay server-only; tables have RLS enabled and no anonymous/authenticated grants. Legacy browser records remain readable through browser tools.
- Profile upgrades merge fields in the existing store key without deleting personalized records; versioned access state is invalidated and every new visit verifies again to prevent legacy skip bypasses.
- Media URLs are imported from permanent asset pointers through a shared browser-safe catalog; original demo WAV tracks require no external music service.
- The root soundtrack owns one persistent audio element; entry autoplay retries in real gestures, and verified custom music replaces its source. Admin previews pause the soundtrack before explicit playback to prevent layering.
- Portraits are compressed and uploaded to private Supabase Storage; profile metadata references object IDs and signed URLs are temporary. IndexedDB is read only to migrate legacy portraits; never store binary data in localStorage.

