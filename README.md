# Freightdesk

A believable freight forwarder website with an AI instant-quote agent on it, plus the admin desk
the forwarder would work out of. Keelson Freight, the company you see throughout, is fictional —
one config file rebrands the entire product for any other.

**Design direction:** Terminal Grid — warm paper, structural ink, one safety orange held under
about 3% of the surface, Schibsted Grotesk over IBM Plex Mono, a visible 12-column hairline
grid, near-square corners.

## Run it

```bash
npm install
cp .env.local.example .env.local   # then paste your Gemini API key
npm run dev
```

The agent needs `GEMINI_API_KEY` set. Without it the widget shows a clean error instead of a
conversation — the site, the seeded desk and the admin views still work.

Two surfaces:

| Route                  | What it is                                                                |
| ---------------------- | ------------------------------------------------------------------------- |
| `/`                    | A freight forwarder's homepage, with the quote agent sitting on top of it   |
| `/admin`               | Enquiries — who asked, what they were quoted, how to reach them            |
| `/admin/conversations` | Every chat word for word, including the ones that never converted          |
| `/admin/automation`    | Which routes the assistant prices itself, and which go to the human team   |

The admin is written for a non-technical logistics client: three focused pages, plain language
("Needs a reply", not "status: new"), no charts, no jargon.

The homepage is a **backdrop**, not a page selling the agent. It talks about the company —
services, schedule, trade lanes, network, credentials — and the agent shows up only as the hero's
"Get an instant quote" call and the floating launcher, the way it would on a real customer's site.

## How the agent works

```
Visitor ──▶ ChatWidget ──▶ lib/agent.ts advance() ──▶ POST /api/quote ──▶ Gemini (gemini-3.6-flash)
                                                              │
                                             tool: get_quote    ──▶ lib/rates.ts computeQuote()
                                             tool: capture_lead ──▶ streamed back, written client-side
                                                              │
                                      SSE: text · quote · captured · turn
```

**The model never invents a price.** `get_quote` is the only path to a number, and it lands in
`computeQuote()` in [`lib/rates.ts`](lib/rates.ts) — the same deterministic function the seeded
desk data uses, so the chat and the admin never contradict each other. The system prompt forbids
stating any figure that did not come back from the tool.

**Tool results reach the browser as typed events**, which is why the rate slip shows a real
line-item breakdown rather than numbers parsed out of prose.

**`lib/agent.ts` kept its shape.** `Slots`, `Step`, `ChatMessage` and `AgentTurn` are unchanged
from the deterministic version — only the parsing half was replaced — so `ChatWidget`, the
conversations inbox and the enquiries table did not have to move. `advance()` is now async.

**Lane automation is honoured.** The Automation page stores its overrides in `localStorage`, so
the browser posts them with each turn; the route applies them to the quote and tells the model
whether to present the figure as an instant rate or a broker-desk guide.

**Transient failures are handled.** Gemini's flash tiers return occasional 503s, sometimes
mid-sentence. A turn retries with backoff, and a partial reply is discarded rather than left
stopping halfway through a number.

## Rebranding it

Everything comes out of [`config/brand.ts`](config/brand.ts). Change it and the site, the chat
widget and the dashboard all follow — there are no hard-coded colours or company names anywhere
else.

- `company` — name, wordmark suffix, legal name, tagline, domain
- `palette` — twelve values, written onto `<html>` as CSS custom properties at runtime
- `network` — countries, lanes, offices; these figures appear in four places and stay in sync
- `services` — the cards in the services grid; `mode` marks a service as quotable by the agent
- `lanes` — the lane board, the rate engine's contracted rates, and the admin's automation list
- `coverage`, `clients`, `stats`, `hero`, `agent` — copy and supporting figures

Swapping a logo: replace `components/site/Wordmark.tsx` with an `<Image>`; nothing else reads it.

## How the quoting works

`lib/rates.ts` is a deterministic pricing function — lane, mode and weight in, an all-in figure,
a transit band and a line-item breakdown out. The same inputs always produce the same number, so
the hero, the lane board, the agent's reply and the dashboard never contradict each other. There
is no carrier or rate API behind it.

`lib/agent.ts` is the conversation. The parsing half is now the model — `advance()` posts the
transcript to `/api/quote` and the model fills the slots (origin, destination, mode, measure, then
name and email), so a visitor can type *"Singapore to Rotterdam, one 40HC"* and get a priced slip
in one turn, or ramble across five and still get there. `Slots`, `Step` and the message shapes are
unchanged from the deterministic version, which is why the widget did not have to move. See
[How the agent works](#how-the-agent-works).

## Where the data lives

`lib/demoScenarios.ts` is the single source for the seeded demo — eight chats, six of which left
contact details. Both the enquiries list and the conversations inbox are built from it, and every
figure is derived from `computeQuote`, so a customer can never show one price on one page and a
different price on another.

Leads, conversations and the automation toggles persist in `localStorage`. Anything you do in the
widget shows up in the admin, including a chat you abandon halfway — that lands in Conversations
as "Left mid-chat" with no enquiry attached. **Reset demo** in the header clears it back to the
seed.

No auth, no payments, no database.

## Deploying

Static on every route — push to a repo and import it on Vercel. Set `GEMINI_API_KEY` there or the
widget will render its error state; everything else works without it.
