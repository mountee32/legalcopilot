# FEAT: Frontend — Global Search (Cmd+K)

## Goal

Fast, universal navigation + semantic search across firm data.

## Scope

- Cmd+K palette (recent + quick actions)
- Search results grouped by entity type (matters, clients, documents)
- "Search within matter" entry point (optional)

## Dependencies

- API: `GET /api/search/semantic`, `GET /api/matters/{id}/search`

## Acceptance Criteria

- Search is keyboard-first and routes reliably to selected result
- Results show enough snippet/context to reduce clicks

## References

- `docs/frontend-design.md` (Global Search)
- `docs/ideas.md` (AI-first retrieval)

---

## Design

### Architecture Overview

The global search will be implemented as a keyboard-accessible command palette (Cmd+K/Ctrl+K) using the `cmdk` library. It will provide:

1. Quick navigation to recent items
2. Quick actions (create case, record time, compose email)
3. Real-time search across cases, clients, and documents
4. Keyboard-first navigation with visual feedback

### Component Structure

```
components/search/
├── command-palette.tsx          # Main command palette modal
├── search-results.tsx            # Grouped search results display
├── recent-items.tsx              # Recent items list
├── quick-actions.tsx             # Quick action shortcuts
└── search-item.tsx               # Individual search result item

lib/hooks/
├── use-command-palette.ts        # Global state for opening/closing palette
├── use-global-search.ts          # Search API integration
└── use-recent-items.ts           # Recent items tracking
```

### Technical Decisions

#### 1. Command Palette Library

**Decision**: Install and use `cmdk` (https://cmdk.paco.me/)

**Rationale**:

- Battle-tested library from Radix UI ecosystem
- Excellent keyboard navigation and accessibility
- Built-in filtering, grouping, and loading states
- Minimal bundle size (~10KB gzipped)
- Works well with shadcn/ui design patterns

#### 2. Search Strategy

**Two-tier approach**:

1. **Instant local search** (0-100ms):
   - Recent items (stored in localStorage)
   - Quick actions (static list)
   - No API call needed

2. **Remote semantic search** (debounced, 300ms):
   - Query `/api/search/global` with search term
   - Returns grouped results: cases, clients, documents
   - Uses existing semantic search infrastructure

#### 3. State Management

- **Global palette state**: Zustand store (`useCommandPaletteStore`)
- **Search query state**: React Query for caching and deduplication
- **Recent items**: localStorage with React hook wrapper

#### 4. API Design

**New endpoint**: `GET /api/search/global`

This will wrap the existing semantic search but return structured results:

```typescript
interface GlobalSearchResponse {
  matters: MatterSearchResult[];
  clients: ClientSearchResult[];
  documents: DocumentSearchResult[];
  query: string;
  totalResults: number;
}

interface MatterSearchResult {
  id: string;
  reference: string;
  title: string;
  clientName: string;
  stage: string;
  practiceArea: string;
  snippet?: string;
}

interface ClientSearchResult {
  id: string;
  name: string;
  email: string;
  type: "individual" | "company";
  activeMatters: number;
  snippet?: string;
}

interface DocumentSearchResult {
  id: string;
  filename: string;
  matterId: string;
  matterReference: string;
  uploadedAt: string;
  snippet?: string; // Matching text chunk
  score: number;
}
```

### Files to Create

#### 1. New Components

**`components/search/command-palette.tsx`**

- Main modal component
- Keyboard listener (Cmd+K/Ctrl+K)
- Tab navigation between sections
- Handles selection and navigation

**`components/search/search-results.tsx`**

- Displays grouped results (cases, clients, documents)
- Uses Command.Group from cmdk
- Shows loading states and empty states

**`components/search/recent-items.tsx`**

- Displays recently viewed items
- Icon per entity type
- Truncates old items (max 10)

**`components/search/quick-actions.tsx`**

- Static list of quick actions
- Keyboard shortcuts displayed
- Routes to appropriate pages/modals

**`components/search/search-item.tsx`**

- Individual result item
- Entity-specific icon and metadata
- Highlight matching text
- Keyboard selection support

#### 2. Hooks

**`lib/hooks/use-command-palette.ts`**

```typescript
// Zustand store for global palette state
interface CommandPaletteStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
```

**`lib/hooks/use-global-search.ts`**

```typescript
// React Query hook for search
export function useGlobalSearch(query: string) {
  return useQuery({
    queryKey: ["search", "global", query],
    queryFn: () => fetchGlobalSearch(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

**`lib/hooks/use-recent-items.ts`**

```typescript
// localStorage wrapper for recent items
export function useRecentItems() {
  const [items, setItems] = useState<RecentItem[]>([]);

  const addRecentItem = (item: RecentItem) => {
    // Add to front, remove duplicates, limit to 10
  };

  return { items, addRecentItem };
}
```

#### 3. API Route

**`app/api/search/global/route.ts`**

- Accepts `q` query parameter
- Searches across matters, clients, documents in parallel
- Returns grouped, scored results
- Implements debouncing on frontend, rate limiting on backend

#### 4. Integration Points

**`components/app-shell/app-shell.tsx`**

- Add `<CommandPalette />` component
- Mounts globally, outside main content

**`components/app-shell/topbar.tsx`**

- Replace static search input with button
- Click opens command palette
- Shows "Search... Cmd+K" placeholder

### UI Flow

#### 1. Opening the Palette

- User presses `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
- Or clicks search button in topbar
- Modal opens with focus on input
- Shows recent items and quick actions by default

#### 2. Searching

- User types query (minimum 2 characters)
- After 300ms debounce, API call fires
- Loading state shows skeletons
- Results grouped: Cases (3), Clients (2), Documents (5)
- Keyboard navigation: Up/Down to select, Enter to navigate

#### 3. Navigation

- **Cases**: Navigate to `/matters/{id}`
- **Clients**: Navigate to `/clients/{id}`
- **Documents**: Navigate to `/documents/{id}` or `/matters/{matterId}/documents`
- **Quick Actions**: Execute action (open modal, navigate to page)

#### 4. Recent Items Tracking

- On navigation to a case/client/document detail page
- Call `addRecentItem()` with entity info
- Stored in localStorage
- Displayed at top of palette when opened

### Quick Actions

Static list of common actions with keyboard shortcuts:

```typescript
const quickActions = [
  {
    id: "new-case",
    label: "New Case",
    icon: FolderKanban,
    shortcut: "Cmd+N",
    href: "/matters/new",
  },
  {
    id: "new-client",
    label: "New Client",
    icon: Users,
    shortcut: "Cmd+Shift+N",
    href: "/clients/new",
  },
  {
    id: "record-time",
    label: "Record Time",
    icon: Clock,
    shortcut: "Cmd+T",
    href: "/billing/time/new",
  },
  {
    id: "compose-email",
    label: "Compose Email",
    icon: Mail,
    shortcut: "Cmd+E",
    action: openComposeModal,
  },
];
```

### Keyboard Shortcuts

| Shortcut           | Action               |
| ------------------ | -------------------- |
| `Cmd+K` / `Ctrl+K` | Open/close search    |
| `Esc`              | Close search         |
| `↑` / `↓`          | Navigate results     |
| `Enter`            | Select result        |
| `Tab`              | Cycle between groups |
| `Cmd+N`            | Quick: New case      |
| `Cmd+Shift+N`      | Quick: New client    |
| `Cmd+T`            | Quick: Record time   |
| `Cmd+E`            | Quick: Compose email |

### Styling

- Use existing shadcn/ui patterns
- Command palette modal: 640px max-width, centered
- Groups separated by subtle borders
- Selected item: primary background with white text
- Icons: Entity-specific colors (case=blue, client=green, document=orange)
- Snippets: Truncated to 2 lines, matching text in bold

### Performance Considerations

1. **Debouncing**: 300ms debounce on search input
2. **Caching**: React Query caches results for 5 minutes
3. **Pagination**: Limit results per group (max 5 per type)
4. **Lazy loading**: Command palette code-split via dynamic import
5. **Recent items**: Load from localStorage on mount only

### Accessibility

- Full keyboard navigation
- ARIA labels on all interactive elements
- Screen reader announcements for result counts
- Focus trap within modal
- ESC key to close
- Visible focus indicators

### Error Handling

- Network errors: Show "Search unavailable" message
- Empty results: Show "No results found" with suggestions
- API timeout: Fall back to recent items only
- Malformed queries: Sanitize and retry

### Testing Strategy

#### Unit Tests

**`tests/unit/components/search/command-palette.test.tsx`**

- Opens on Cmd+K keypress
- Closes on Esc keypress
- Focuses input on open
- Shows recent items by default

**`tests/unit/lib/hooks/use-global-search.test.ts`**

- Debounces search queries
- Returns grouped results
- Handles empty query
- Handles API errors

**`tests/unit/lib/hooks/use-recent-items.test.ts`**

- Adds items to recent list
- Limits to 10 items
- Removes duplicates
- Persists to localStorage

#### Integration Tests

**`tests/integration/search/global-search.test.ts`**

- Searches across matters, clients, documents
- Returns results grouped by type
- Respects tenant isolation
- Applies correct permissions

#### E2E Tests

**`tests/e2e/browser/search-navigation.spec.ts`**

- Open palette with Cmd+K
- Search for case by reference
- Navigate to case detail
- Verify case appears in recent items

### Dependencies to Add

**Production**:

```json
{
  "cmdk": "^1.0.4"
}
```

**DevDependencies**: None (all testing tools already present)

### Files to Modify

#### 1. Add command palette to app shell

**`components/app-shell/app-shell.tsx`**

```typescript
import { CommandPalette } from "@/components/search/command-palette";

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">{children}</main>
        <MobileNav />
      </div>

      {/* Global command palette */}
      <CommandPalette />
    </div>
  );
}
```

#### 2. Update topbar search input

**`components/app-shell/topbar.tsx`**

```typescript
import { useCommandPaletteStore } from "@/lib/hooks/use-command-palette";

export function Topbar({ onMenuClick }: TopbarProps) {
  const openSearch = useCommandPaletteStore((state) => state.open);

  return (
    <header>
      {/* ... */}
      <div className="flex-1 md:max-w-md">
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          onClick={openSearch}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="text-muted-foreground">Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>
      {/* ... */}
    </header>
  );
}
```

#### 3. Track recent items on detail pages

**Pattern to apply on all detail pages**:

```typescript
import { useRecentItems } from "@/lib/hooks/use-recent-items";

export default function MatterDetailPage({ params }: { params: { id: string } }) {
  const { addRecentItem } = useRecentItems();
  const matter = useMatter(params.id);

  useEffect(() => {
    if (matter) {
      addRecentItem({
        type: "matter",
        id: matter.id,
        label: matter.reference,
        sublabel: matter.clientName,
        href: `/matters/${matter.id}`,
      });
    }
  }, [matter, addRecentItem]);

  // ... rest of component
}
```

Apply to:

- `/app/(app)/matters/[id]/page.tsx`
- `/app/(app)/clients/[id]/page.tsx`
- `/app/(app)/documents/[id]/page.tsx` (if exists)

### Implementation Phases

**Phase 1: Basic palette and quick actions (2-3 hours)**

1. Install `cmdk` dependency
2. Create command palette component with keyboard listeners
3. Implement quick actions
4. Add recent items tracking
5. Integrate into app shell

**Phase 2: Search integration (2-3 hours)**

1. Create global search API endpoint
2. Implement search hooks
3. Create search results components
4. Wire up API to UI

**Phase 3: Polish and testing (1-2 hours)**

1. Add loading states and error handling
2. Implement keyboard shortcuts
3. Write unit and integration tests
4. Test cross-browser compatibility

**Total estimate**: 5-8 hours

### Open Questions

1. **Search within matter**: Should the command palette support scoped search (e.g., "search only in current case")?
   - **Decision**: Not in MVP. Can be added later with a scope selector.

2. **Search operators**: Support advanced syntax like `type:case status:active`?
   - **Decision**: Not in MVP. Start with simple text search.

3. **Document preview**: Show document thumbnails in search results?
   - **Decision**: Not in MVP. Text snippets are sufficient.

4. **Search analytics**: Track popular searches for improvement?
   - **Decision**: Yes, but via existing audit log. No special implementation needed.

### Success Metrics

- 90%+ of users use Cmd+K within first week
- Average time to navigate reduced by 30%
- Search result click-through rate >60%
- Zero accessibility violations in audit

---

## Ready for Development

This feature is now fully designed and ready for implementation. The design covers:

- Component architecture and file structure
- API design and data flow
- UI/UX patterns and keyboard shortcuts
- Testing strategy
- Performance and accessibility considerations
- Clear implementation phases

All dependencies are documented and the integration points with existing code are specified.
