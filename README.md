# SOI Klaviyo MCP

Custom remote MCP server for Klaviyo, designed to fill the gaps in Claude's native Klaviyo connector.
Server-side Klaviyo Private API Key (no Klaviyo OAuth) and a static-password OAuth gate for Claude. Stateless — no database or Redis.

## Tools (23)

**Templates**: `get_templates`, `create_template`, `update_template`, `delete_template`, `clone_template`, `render_template`

**Segments**: `create_segment`, `update_segment`, `delete_segment`

**Lists**: `create_list`, `update_list`, `delete_list`, `add_profiles_to_list`, `remove_profiles_from_list`, `get_list_profiles`

**Flows**: `create_flow`, `update_flow_status`, `update_flow_action`, `get_flow_action`, `get_flow_message`, `get_flow_actions`, `get_flow_action_ids`, `delete_flow`

Each tool exposes the full Klaviyo endpoint surface — filters, sorts, pagination, sparse fieldsets (`fields[*]`), `additional-fields[*]`, `include`, and the full request body schema.

## Architecture

```
Claude Desktop  ──OAuth(PKCE)──>  /oauth/{authorize,token,register}  ──>  Bearer JWT
       │
       └──Bearer──>  /mcp  ──Klaviyo Private API Key──>  Klaviyo REST API
```

- Next.js 15 App Router on Vercel (Node runtime)
- `mcp-handler` for the MCP transport (Streamable HTTP)
- **Stateless OAuth** — every issued artifact (client_id, auth code, access token) is a signed JWT. No DB, no Redis.
- Static password gate on the consent screen — no user accounts

## OAuth model

Single signing secret (`JWT_SECRET`) signs three kinds of JWTs:

| Artifact | TTL | Claims |
|---|---|---|
| `client_id` (issued at `/oauth/register`) | 1 year | `redirect_uris`, `client_name` |
| Authorization code | 5 min | `client_id`, `redirect_uri`, `code_challenge`, `scope` |
| Access token | 30 days | `client_id`, `scope` |

Public clients only (`token_endpoint_auth_method=none`). PKCE (S256) is required.

**To revoke all access**: rotate `JWT_SECRET` and redeploy. Every issued token becomes invalid immediately.

## One-time setup

### 1. Create the Klaviyo private API key

In Klaviyo: **Account → Settings → API Keys → Create Private API Key**.

Required scopes:
- Templates: Read/Write
- Segments: Read/Write
- Lists: Read/Write
- Profiles: Read/Write (needed for list membership ops)
- Flows: Read/Write

Copy the `pk_...` key.

### 2. Deploy to Vercel

```bash
npm install
vercel link
vercel deploy --prod
```

Note the production URL (e.g. `https://soi-mcp.vercel.app`).

### 3. Set env vars

In Vercel **Settings → Environment Variables** (Production scope):

| Name | Value |
|---|---|
| `PUBLIC_URL` | Your production URL, no trailing slash |
| `CONNECTOR_PASSWORD` | Long random string — you'll type this into Claude's consent screen |
| `JWT_SECRET` | At least 32 chars. Generate with `openssl rand -base64 48` |
| `KLAVIYO_API_KEY` | The `pk_...` key from step 1 |
| `KLAVIYO_API_REVISION` | `2026-04-15` (or newer) |

Redeploy after adding env vars: `vercel deploy --prod`.

### 4. Add the custom connector in Claude

In Claude Desktop or claude.ai:
**Settings → Connectors → Add custom connector**

- **Name**: Klaviyo (custom)
- **URL**: `https://soi-mcp.vercel.app/mcp`

Claude will discover the OAuth metadata, register itself, and redirect you to the consent screen. Enter `CONNECTOR_PASSWORD` and click **Approve**. Tools then appear in Claude.

## Local development

```bash
cp .env.example .env.local
# fill in PUBLIC_URL=http://localhost:3000, JWT_SECRET, etc.
npm install
npm run dev
```

Local OAuth works against `http://localhost:3000`, but Claude Desktop expects an HTTPS URL — for end-to-end testing deploy to a Vercel preview.

## Notes / caveats

- **`update_flow_action`** — Klaviyo restricts which fields are patchable per action type. Pass a `definition` object containing the action-type-specific `data` block per [Klaviyo's update_flow_action docs](https://developers.klaviyo.com/en/reference/update_flow_action). The tool does not validate the field list; Klaviyo returns 400 with specifics if a field isn't editable.
- **Segment / flow definitions** — `create_segment` and `create_flow` accept `definition` as a freeform object, passed through to Klaviyo verbatim. Match Klaviyo's segment-definition / flow-definition schema exactly.
- **`update_segment` `is_active`** — When deactivating a segment via `is_active=false`, Klaviyo requires that to be the only attribute in the request. Don't combine with name/definition/is_starred.
- **Page size ceilings** — `get_templates` max 10, `get_flow_actions` / `get_flow_action_ids` max 50, `get_list_profiles` max 100 (Klaviyo-enforced).
- **Token TTL** — Access tokens are valid for 30 days. After that you'll be prompted to re-authorize.
- **PKCE** — Auth-code interception is mitigated by PKCE; an attacker who captures the code can't redeem it without the verifier (only Claude has it).

## File map

```
app/
  .well-known/
    oauth-authorization-server/route.ts   # OAuth AS metadata
    oauth-protected-resource/route.ts     # Resource metadata (points at AS)
  oauth/
    register/route.ts                      # RFC 7591 dynamic client registration (issues JWT client_id)
    authorize/route.ts                     # Consent page (GET) + approval (POST, issues JWT auth code)
    token/route.ts                         # PKCE code exchange (issues JWT access token)
  mcp/route.ts                             # MCP endpoint (bearer-gated)
  layout.tsx, page.tsx                     # Static landing page
lib/
  klaviyo.ts                               # Typed Klaviyo fetch client
  oauth.ts                                 # PKCE verify, bearer validation, password compare
  storage.ts                               # JWT sign/verify for client_id, auth code, access token
  tools/
    types.ts
    templates.ts segments.ts lists.ts flows.ts
    index.ts                               # registerAllTools(server)
```
