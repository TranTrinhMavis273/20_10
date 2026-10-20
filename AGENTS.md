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
- All data access (profiles, replies, settings, progress) goes through `src/lib/store.ts` (browser localStorage today) so a real backend with auth can replace it without UI changes.
- `/admin` uses server-verified shared-password encrypted HttpOnly sessions; browser-local records remain readable/editable through browser tools, so never claim this gate secures the data. All future private server APIs must independently require the admin session.
- Profile upgrades merge fields in the existing store key without deleting personalized records; versioned access state is invalidated and every new visit verifies again to prevent legacy skip bypasses.
- Media URLs are imported from permanent asset pointers through a shared browser-safe catalog; original demo WAV tracks require no external music service.
- The root soundtrack owns one persistent audio element; entry autoplay retries in real gestures, and verified custom music replaces its source. Admin previews pause the soundtrack before explicit playback to prevent layering.
- Portrait blobs are compressed and stored in IndexedDB; profile metadata references their IDs, never stores binary data in localStorage.

