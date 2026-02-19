# Soul-Link avatar: User A sets avatar for User B

Use this prompt when you implement the flow (e.g. with nano banana or another picker) so that **User A sets the avatar for User B** — i.e. the linked partner chooses the image that represents the other person in PIP.

## Current implementation (no picker in Settings)

- **Settings (SoulLinkSection):** No avatar picker. Linking is code-only.
- **PIP orb (OrbitalPresence):** Shows a **single image** for the partner:
  - If the partner’s Firestore doc has `soulLinkAvatarUrl` set → that URL is shown (dynamic).
  - Otherwise → a **default avatar** is used: [DiceBear Adventurer](https://www.dicebear.com/styles/adventurer/) (same seed = same avatar; seed is `partnerId` or display name). See `getDefaultAvatarUri()` in `OrbitalPresence.tsx`.

So the orb always shows a normal image (URL or default); the source stays Firestore so it can be changed later.

## Default avatar attribution (CC BY 4.0)

The default partner avatar in the Soul-Link PIP orb uses the **Adventurer** style by [Lisa Wischofsky](https://www.instagram.com/lischi_art/), via [DiceBear](https://www.dicebear.com/styles/adventurer/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). When using this default (no custom `soulLinkAvatarUrl`), please keep this attribution in app credits or docs.

## Data model (Firestore)

- **User doc (partner’s doc):** `soulLinkAvatarUrl?: string | null`
- **PartnerAura** (what you get when you subscribe to the partner): includes `avatarUrl` from their `soulLinkAvatarUrl`.
- **OrbitalPresence** uses `partnerAura?.avatarUrl ?? getDefaultAvatarUri(partnerId ?? displayName)` (DiceBear Adventurer).

## What to implement

**Goal:** User A (me), when linked to User B (partner), can set the image that represents B in my PIP orb. So “A sets the avatar for B.”

**Option A – Write on partner’s doc (recommended)**

1. **Cloud Function** (e.g. `setPartnerAvatar`):
   - Input: `{ partnerDeviceId: string, avatarUrl: string }`
   - Check: caller’s `soulLinkPartnerId === partnerDeviceId` (only my linked partner).
   - Write: `users/{partnerDeviceId}` with `soulLinkAvatarUrl: avatarUrl` (merge).

2. **App (your flow, e.g. nano banana):**
   - User A chooses an image for their partner (nano banana or any picker).
   - Upload image to Firebase Storage (e.g. path `soulLinkAvatars/{partnerDeviceId}.jpg` so it’s “avatar for partner”).
   - Get the download URL, then call the callable: `setPartnerAvatar(partnerDeviceId, downloadUrl)`.

3. **Existing service:** You can add a client method that calls this callable (e.g. `SoulLinkService.setPartnerAvatarUrl(partnerId, url)`). The existing `setMyAvatarUrl` writes *my* doc; for “A sets B’s avatar” you need this new callable + client call.

**Option B – Store on my doc (no Cloud Function)**

- Store on *my* user doc something like: `soulLinkPartnerAvatarUrl?: string` (the URL I chose for my partner).
- In the app, when building “partner avatar” for the orb, read this field first (from my doc); if missing, fall back to partner’s `soulLinkAvatarUrl` or the default image.
- Downside: the “avatar for B” is per-viewer (each partner could see a different image for B). Option A gives one canonical avatar per user.

## Copy-paste prompt for implementation

Use this when you wire up nano banana (or any image source) and the backend:

---

**Soul-Link avatar flow**

- **Rule:** User A sets the avatar for User B. So the viewer (A) chooses the image that represents their linked partner (B) in the PIP orb.
- **Do not** add an avatar picker in Settings. Avatar is set elsewhere in the app (e.g. from a screen where A sees B and can “Set avatar for [B]”).
- **Backend:** Add a callable `setPartnerAvatar` that accepts `{ partnerDeviceId, avatarUrl }`, verifies the caller is linked to that partner, then updates `users/{partnerDeviceId}` with `soulLinkAvatarUrl: avatarUrl`.
- **Storage:** When A picks an image for B, upload it (e.g. to `soulLinkAvatars/{partnerDeviceId}.jpg`), get the download URL, then call `setPartnerAvatar(partnerDeviceId, url)`.
- **Display:** The PIP orb already reads `partnerAura.avatarUrl` (from the partner’s `soulLinkAvatarUrl`). When that is set, the orb shows it; when null, it shows the DiceBear Adventurer default (seed = partnerId or display name) from `OrbitalPresence.tsx`. Keep this behaviour; only the source of `soulLinkAvatarUrl` changes (set by the partner’s linked user via the new callable).

---

## Changing the default image later

In `common/components/soulLink/OrbitalPresence.tsx`, the default is built by `getDefaultAvatarUri(seed)` using the DiceBear Adventurer API. To use a local asset instead, replace the fallback so that when `partnerAvatarUrl` is null you use e.g. `require("@common/assets/soulLinkDefaultAvatar.png")`. The orb will still be dynamic from Firestore when `partnerAura.avatarUrl` is set.
