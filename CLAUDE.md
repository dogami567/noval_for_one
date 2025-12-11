# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Report Writing Assistant** - an AI-powered web application for creating structured reports. The application uses Google's Gemini AI to assist with report structure planning and content generation.

**Tech Stack:**
- React 19 + TypeScript
- Vite (build tool, dev server port 5174)
- Google Gemini AI (`@google/generative-ai` v0.21.0)
- Lucide React (icons)
- XLSX (Excel file parsing)

## Recent Refactoring History (2025-11-25)

**Refactoring Assistant:** Claude Code (Opus 4.1)

**Context:** This section documents a major refactoring session completed on 2025-11-25 to unify the project's LLM provider architecture and directory structure.

### Git Commit History

1. **`a909476`** - "refactor(services): migrate all AI services to LLMFactory"
   - Migrated `layoutService.ts`, `geminiService.ts`, `auditorService.ts`, `templateService.ts`
   - Removed direct Google SDK dependencies from all services
   - Converted Function Calling to JSON-based Prompt Engineering

2. **`4d5a248`** - "refactor(structure): unify project structure - move all source code to src/"
   - Moved 13 files from root to `src/` directory
   - Updated all import paths
   - Configured `tsconfig.json` with `"include": ["src"]`
   - Updated `index.html` entry point to `/src/index.tsx`

3. **`7fe427f`** - "chore(config): update claude settings"

### Critical Package Fix: @google/genai → @google/generative-ai

**Problem:** Project was using incorrect package name `@google/genai` (v1.30.0) which caused authentication errors:
```
ApiError: {"error":"Unauthorized - Invalid API Key format. Expected format: sk-ant-api03-xxx"}
```

**Root Cause:** The incorrect package was expecting Claude-style API keys instead of Google API keys.

**Solution Applied:**
1. Updated `package.json`: `@google/genai` → `@google/generative-ai` (v0.21.0)
2. Rewrote `src/services/llm/adapters/GeminiAdapter.ts` with correct SDK API:
   - `GoogleGenAI` → `GoogleGenerativeAI`
   - `new GoogleGenAI({ apiKey })` → `new GoogleGenerativeAI(apiKey)`
   - Fixed streaming and JSON generation methods
3. Removed 66 incorrect packages, installed correct package
4. Cleared Vite cache (`node_modules/.vite`) to resolve dependency resolution errors

**Verified Working:** Test passed with API key and model `gemini-2.5-flash`

### LLM Abstraction Layer Implementation

**Architecture Pattern:** Factory + Adapter Pattern

**New File Structure:**
```
src/services/llm/
├── LLMFactory.ts          # Provider factory and initialization
├── types.ts               # LLMProvider interface, LLMConfig
└── adapters/
    └── GeminiAdapter.ts   # Gemini-specific implementation
```

**Key Design Decision:** Migrated from Gemini's Function Calling (Tools) to **Prompt Engineering with JSON mode**

**Rationale:**
- Function Calling is Gemini-specific and not portable to other providers
- JSON-based prompts work across all modern LLMs (Claude, GPT-4, etc.)
- Maintains same functionality while achieving provider agnosticism

**Migration Strategy:**
```typescript
// Before: Function Calling
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [updateStructureTool]
});
const result = await model.generateContent(messages);
const functionCall = result.response.functionCalls()[0];

// After: JSON Prompt Engineering
const prompt = `${systemInstruction}\n\n请返回 JSON 格式:\n${schema}`;
const result = await LLMFactory.getProvider().generateJSON<T>(prompt);
```

**Services Migrated:**
- `streamSectionChat()` - Uses `generateStream()` for incremental text
- `chatWithStructureArchitect()` - Uses `generateJSON()` for subsection updates
- `chatWithGlobalArchitect()` - Uses `generateJSON()` for chapter updates
- `generateLayoutGuide()` - Uses `generateJSON()` for PPT layouts
- `analyzeReportQuality()` - Uses `generateJSON()` for audit results
- `extractChaptersFromExcel()` - Uses `generateJSON()` for template parsing

**Code Reduction:**
- `geminiService.ts`: 296 → 222 lines (-25%)
- `layoutService.ts`: 85 → 48 lines (-43%)
- `auditorService.ts`: 137 → 99 lines (-28%)
- `templateService.ts`: 59 → 22 lines (-63%)

### Directory Structure Unification

**Before:**
```
project/
├── App.tsx                    # Root level
├── components/                # Root level
├── services/                  # Root level
├── constants.ts               # Root level
├── types.ts                   # Root level (duplicate)
└── src/
    ├── index.tsx
    ├── types.ts
    └── services/llm/
```

**After:**
```
project/
├── src/                       # All source code unified here
│   ├── App.tsx
│   ├── index.tsx
│   ├── constants.ts
│   ├── types.ts              # Removed duplicate root-level file
│   ├── components/
│   │   ├── ChatInterface.tsx
│   │   ├── Sidebar.tsx
│   │   └── SlideEditor.tsx
│   └── services/
│       ├── geminiService.ts
│       ├── layoutService.ts
│       ├── auditorService.ts
│       ├── templateService.ts
│       ├── knowledgeService.ts
│       ├── placeholderService.ts
│       └── llm/
│           ├── LLMFactory.ts
│           ├── types.ts
│           └── adapters/
│               └── GeminiAdapter.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

**Import Path Fixes:** All relative imports updated from `'../src/services/llm/...'` to `'./llm/...'`

### Vite Cache Issue Resolution

**Error Encountered:**
```
Error: ENOENT: no such file or directory, open 'D:\\xiangmu\\report-assistant\\node_modules\\@google\\genai\\dist\\web\\index.mjs'
```

**Cause:** Vite's pre-bundling cache (`node_modules/.vite`) retained references to old package structure

**Fix Applied:**
```bash
rm -rf node_modules/.vite
rm -rf node_modules/@google/genai
npm install
npm run dev  # Successfully started on port 5174
```

**Lesson:** Always clear Vite cache after changing package names or major dependency updates.

### Testing and Verification

**TypeScript Compilation:** ✅ Passed `npx tsc --noEmit` (no errors)

**Development Server:** ✅ Running on port 5174

**API Integration:** ✅ Tested with Gemini API key `AIzaSyDCPF9J6YUQ-LMkVHdoPjSPZY1z3NbWUIM`

**Model:** `gemini-2.5-flash`

### For Future Developers (接棒手)

**What Was Accomplished:**
- ✅ Unified LLM provider architecture with Factory pattern
- ✅ Achieved provider-agnostic codebase (can swap Gemini → Claude/GPT)
- ✅ Standardized directory structure (all code in `src/`)
- ✅ Converted Function Calling to JSON Prompts for portability
- ✅ Fixed incorrect package dependency
- ✅ Reduced code complexity across all services (-25% to -63%)

**How to Add New LLM Providers:**
1. Create new adapter in `src/services/llm/adapters/` (e.g., `ClaudeAdapter.ts`)
2. Implement `LLMProvider` interface with `generateStream()` and `generateJSON()`
3. Register in `LLMFactory.ts` switch statement
4. Set environment variable: `LLM_PROVIDER=claude`

**Important Files to Understand:**
- [src/services/llm/LLMFactory.ts](src/services/llm/LLMFactory.ts) - Provider initialization logic
- [src/services/geminiService.ts](src/services/geminiService.ts) - Chat orchestration and prompt formatting
- [src/services/llm/types.ts](src/services/llm/types.ts) - Core interfaces
- [src/constants.ts](src/constants.ts) - System prompts for all three AI agents

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (starts on port 5174)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Environment Setup:**
- Create [.env.local](.env.local) file
- Set `GEMINI_API_KEY=your_api_key_here`
- The Vite config maps this to `process.env.API_KEY` in code

## Architecture Overview

### Three-Tier Hierarchical Structure

The application uses a three-level content hierarchy:

1. **Global Level** - Entire report overview
2. **Chapter Level** - Major sections (e.g., "1. Company Overview", "2. Operations")
3. **Subsection Level** - Detailed content units (e.g., "1.1 Product Strategy")

### Three AI Agent Modes

Each level has a specialized AI agent with different capabilities:

| Mode | Location | Purpose | AI Capability |
|------|----------|---------|---------------|
| **Global Architect** | Global selection | Plan overall report structure | JSON-based prompt engineering to update chapters list |
| **Chapter Architect** | Chapter selection | Design subsections within a chapter | JSON-based prompt engineering to update subsections list |
| **Content Writer** | Subsection selection | Generate/edit actual content | Streaming text generation |

**Implementation:** See [src/services/geminiService.ts](src/services/geminiService.ts)
- `chatWithGlobalArchitect()` - Updates report chapters
- `chatWithStructureArchitect()` - Updates chapter subsections
- `streamSectionChat()` - Generates subsection content with streaming

### State Management

Centralized in [src/App.tsx](src/App.tsx) using React hooks:

- `chapters` - All report data (chapters → subsections → content)
- `globalContext` - Shared company background information injected into all AI prompts
- `globalMessages` - Chat history for global architect
- `selection` - Current active selection (global/chapter/subsection)
- `isLoading` - Loading state for AI operations

**Key Pattern:** Each chapter and subsection maintains its own chat history in the `messages` array.

### Component Structure

```
src/App.tsx (main state + orchestration)
├── src/components/Sidebar.tsx (navigation tree, CRUD operations)
├── src/components/SlideEditor.tsx (content editor with global context)
└── src/components/ChatInterface.tsx (chat UI + file attachments)
```

### Critical Concepts

**Context Prompt System:**
- Each subsection has a `contextPrompt` field
- This provides AI-specific writing instructions (e.g., "Follow the style guide", "Use professional tone")
- Set by Chapter Architect when creating subsections
- Used by Content Writer when generating content

**Global Context Injection:**
- `globalContext` (company background) is injected into ALL AI system prompts
- Implemented via `injectGlobalContext()` helper in [src/services/geminiService.ts](src/services/geminiService.ts)
- Ensures consistency across all AI-generated content

**Smart Numbering:**
- Subsections auto-number based on chapter prefix (e.g., Chapter "2. Operations" -> "2.1", "2.2")
- Logic in `handleAddSubsection()` at [src/App.tsx](src/App.tsx)

## Common Development Tasks

### Adding a New AI Agent Mode

1. Define system instruction constant in [src/constants.ts](src/constants.ts)
2. Create service function in [src/services/geminiService.ts](src/services/geminiService.ts)
3. Use JSON-based prompt engineering with `LLMFactory.getProvider().generateJSON<T>()`
4. Wire up in `handleSendMessage()` callback in [src/App.tsx](src/App.tsx)

### Modifying Initial Report Template

Edit `INITIAL_CHAPTERS` array in [src/constants.ts](src/constants.ts) to change:
- Default chapters
- Sample subsections
- Initial context prompts
- Welcome messages

### Adding File Type Support

Extend attachment handling in `formatChatHistory()` at [src/services/geminiService.ts](src/services/geminiService.ts):
- Text-based files (CSV, JSON) are decoded and embedded as markdown code blocks
- Binary files (images, PDFs) use `inlineData` format for Gemini API

### Export Functionality

Current implementation exports full report as Markdown ([src/App.tsx](src/App.tsx)).

To add other formats (PDF, Word):
- Install appropriate library (e.g., `jspdf`, `docx`)
- Create new export handler similar to `handleExportReport()`
- Wire up in [src/components/Sidebar.tsx](src/components/Sidebar.tsx) export button

## Type Definitions

Core types in [src/types.ts](src/types.ts):

- `Chapter` - Top-level section with title, overview, subsections, messages
- `SubSection` - Content unit with title, content, contextPrompt, messages
- `Message` - Chat message with role (user/model), text, optional attachments
- `ActiveSelection` - Current UI selection state (type + id + parentId)
- `Attachment` - File attachment with name, mimeType, base64 data

## Configuration Files

- [vite.config.ts](vite.config.ts) - Vite configuration with env variable mapping
- [tsconfig.json](tsconfig.json) - TypeScript configuration
- [package.json](package.json) - Dependencies and scripts
- [.env.local](.env.local) - API key (not committed to git)

## Important Development Notes

**State Update Pattern:**
- Always use functional updates for nested state: `setChapters(prev => prev.map(...))`
- This prevents stale closure issues in async callbacks

**Gemini API Model:**
- Currently using `gemini-2.5-flash` model
- Configured in [src/services/geminiService.ts](src/services/geminiService.ts)
- To change model, update `LLM_MODEL_NAME` in environment variables or `.env.local`

**Smart Merge Logic:**
- When Global Architect returns new chapters, existing chapters are preserved by title matching
- Implementation at [src/App.tsx](src/App.tsx)
- Prevents data loss when AI restructures the report

**Character Encoding:**
- UTF-8 file attachments require special Base64 decoding
- Helper function `decodeBase64UTF8()` at [src/services/geminiService.ts](src/services/geminiService.ts)
