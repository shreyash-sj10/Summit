# ABHIMAT Interview Scope

This document defines the active, defendable scope for interview demos.

## Active System Modules

- Authentication and role-based access (`member`, `moderator`, `judge`, `display`)
- Session stage governance (8-stage flow)
- Raise-hand window and queue orchestration
- Speaker lifecycle (`approve`, `done`, `revoke`)
- Official grading pipeline and team leaderboard updates
- Poll creation, voting, and closure

## Removed Modules (Current Scope)

- Chat subsystem
- Power-card subsystem

These modules are intentionally removed from active code paths to keep the project focused on real-time governance and evaluation workflows.

## Current Project Layout

- `client/`: React + Zustand role dashboards and realtime-aware state
- `server/`: Express APIs and workflow orchestration
- `server/supabase_schema.sql`: canonical schema for current active modules

## Interview Positioning

Describe ABHIMAT as a multi-role, real-time governance platform with deterministic queue control, stage-driven workflow, and official scoring-to-leaderboard resolution.
