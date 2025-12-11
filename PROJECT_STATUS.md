# Project Status: Project Dogami (Her Universe)

**Current Phase**: Infrastructure & Fix
**Last Updated**: 2025-12-11
**Current Instruction**: `修改意见/001-setup-and-map.md`

## 🚀 Active Task
- **Task**: Fix Missing Map & Implement Interactive Zoom
- **Owner**: Execution Agent
- **Status**: **Pending Execution**
- **Context**: 
    - Deployment has a "black screen" bug due to missing map assets/css.
    - We are replacing the old `MapBackground` with a robust `InteractiveMap` (PRD v1.3).

## 📋 Backlog
1.  [ ] **Supabase Config**: Generate SQL schema and setup environment variables.
2.  [ ] **Module A (The Atlas)**: Connect Map Pins to Drawer.
3.  [ ] **Module B (The Wiki)**: Build Character Card components.
4.  [ ] **Module D (The Tavern)**: Implement RP interface.

## 🧠 Architecture Notes
- **Stack**: Vite + React + Vercel Functions.
- **Critical**: Use fallback colors for map background to prevent "black screen of death".