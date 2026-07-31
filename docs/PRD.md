# Shirt Bazaar — Product Requirements Document

## Overview
Shirt Bazaar is a marketplace for AI-generated, one-of-one t-shirt designs. Users browse a home feed organized into columns by visual "vibe," claim (buy) designs they like to become the exclusive owner, and can generate their own designs by uploading style references. Ownership of a claimed design comes with an auto-provisioned personal storefront and a permanent royalty on future resales.

## Problem
Off-the-shelf t-shirt shopping is either generic (mass-market blanks) or slow and effortful (fully custom print-on-demand storefronts that take real work to set up). Nobody has built a "cool t-shirt" brand around taste and speed — browse-and-buy AI-generated designs that already match your aesthetic, with the emotional payoff of a fully custom piece and the convenience of an off-the-shelf purchase.

## Target user
- Primary: 18-34 year-olds who care about how they dress but don't want to design a shirt themselves — they want to recognize their vibe in someone else's taste.
- Secondary: creators/taste-makers who want to monetize a knack for prompting or curating good designs, either by claiming and reselling, or by renting a column.

## Core user stories

### Browse & discover
- As a visitor, I see a home feed of columns, each a distinct vibe, so I can find designs that match my taste without searching.
- As a visitor, I can search/filter across vibes and creators.
- As a user, I can follow other users so their columns appear on my own feed.

### Personalize generation
- As a user, I can upload shirts I already love as style references, so what gets generated for me matches my taste.
- As a user, I can set which vibes I want to see and generate from.

### Claim & own
- As a user, when I buy a design, I get exclusive one-of-one ownership by default — never a paid add-on.
- As a user, claiming a design auto-provisions my own storefront (a shareable link), which also serves as proof I claimed it first.
- As a user, I earn a royalty on every future resale of a design I claimed, for as long as it keeps selling.

### Monetize taste
- As a user, I can pay for a high-quality upscale/regeneration on top of a cheap draft.
- As a user, I can pay to take over a front-page column and run my own prompts on it.

### Fulfillment
- As a user, I choose from print-quality tiers described only by feel and price ("here's how each one feels") — the underlying provider is never shown to me.
- As a user, I can configure front/back placement and size for my design.

### Growth loop
- As a user, after I claim a design, I receive a ready-to-post shareable image of it, so I can post it with minimal friction.

## Success metrics (draft — replace with real targets once there's usage data)
- Claim rate: share of feed viewers who claim a design within their first session.
- Resale rate: share of claimed designs resold at least once (validates the royalty flywheel).
- Share rate: share of claimants who post the auto-generated share image within 48 hours.
- Time to first claim for a new user.

## Out of scope for v1
- Cross-posting to Etsy, Amazon, or other marketplaces (explicitly deferred as a v3/v4 idea).
- Native mobile app (responsive web only for v1).
- Any built-out behavior for the "Twin" settings tab beyond a placeholder.
- Automated trademark or patent filing (copyright plus first-use timestamping only).
