# React Components Reference

Complete reference for all frontend React components in the Web Chat System.

## Component Architecture

```
App (Root)
└── ChatContext.Provider
    ├── LoginForm
    └── ChatContainer
        ├── ChatHeader
        ├── RoomSelector
        ├── MessageList
        │   └── MessageBubble (Array)
        ├── MessageInput
        └── ConnectionStatus
```

## Component Index

| Component | File | Purpose | Props |
|-----------|------|---------|-------|
| App | `App.tsx` | Root application | None |
| LoginForm | `LoginForm.tsx` | User authentication | `onLogin` |
| ChatContainer | `ChatContainer.tsx` | Main chat interface | `currentUser`, `currentRoom`, `messages`, `onSendMessage` |
| ChatHeader | `ChatHeader.tsx` | Room info display | `currentRoom`, `currentUser` |
| RoomSelector | `RoomSelector.tsx` | Room switching UI | `currentRoom`, `onRoomChange` |
| MessageList | `MessageList.tsx` | Message display | `messages`, `currentUser`, `isLoading` |
| MessageBubble | `MessageBubble.tsx` | Individual message | `message`, `isOwn`, `onReply` |
| MessageInput | `MessageInput.tsx` | Message composition | `onSendMessage`, `onFileUpload`, `disabled` |
| ConnectionStatus | `ConnectionStatus.tsx` | SSE connection indicator | `connectionState` |
| Aurora | `Aurora.tsx` | Background animation | None |

---

## App (Root Component)

**File:** `client/src/App.tsx`

**Purpose:** Application entry point, manages authentication state and SSE connections.

**State:**
```typescript
{
  currentUser: string;      // Current user ID
  currentRoom: Room;        // Current room object
  messages: Message[];      // Message list
  isConnected: boolean;     // Authentication state
  isLoading: boolean;      // Loading indicator
}
```

**Key Features:**
- User authentication flow
- Room switching logic
- SSE connection management
- Message state management
- LocalStorage persistence

**Usage:**
```tsx
// Entry point in main.tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Important Methods:**
- `handleLogin(userId)`: Authenticates user
- `handleRoomChange(room)`: Switches rooms
- `handleSendMessage(content)`: Sends message
- `initializeSSE()`: Sets up SSE connection

---

## LoginForm

**File:** `client/src/components/LoginForm.tsx`

**Purpose:** User authentication interface.

**Props:**
```typescript
interface LoginFormProps {
  onLogin: (userId: string) => void;
}
```

**Features:**
- Custom user ID input
- Validation (non-empty)
- Error display
- Form submission handling

**Validation Rules:**
- User ID cannot be empty
- No length limit (reasonable limits recommended)
- Alphanumeric characters allowed

**Example Usage:**
```tsx
<LoginForm
  onLogin={(userId) => {
    console.log('User logged in:', userId);
  }}
/>
```

---

## ChatContainer

**File:** `client/src/components/ChatContainer.tsx`

**Purpose:** Main chat interface container.

**Props:**
```typescript
interface ChatContainerProps {
  currentUser: string;
  currentRoom: Room;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onRoomChange: (room: Room) => void;
  onFileUpload?: (file: File) => Promise<string>;
}
```

**Components Used:**
- ChatHeader
- RoomSelector
- MessageList
- MessageInput
- ConnectionStatus

**Responsiveness:**
- Mobile-first design
- Adaptive layout
- Touch-friendly controls

**Example Usage:**
```tsx
<ChatContainer
  currentUser="alice123"
  currentRoom={{ id: 1, name: "私密房间", isPublic: false }}
  messages={messages}
  isLoading={false}
  onSendMessage={handleSendMessage}
  onRoomChange={handleRoomChange}
/>
```

---

## ChatHeader

**File:** `client/src/components/ChatHeader.tsx`

**Purpose:** Display current room and user information.

**Props:**
```typescript
interface ChatHeaderProps {
  currentRoom: Room;
  currentUser: string;
}
```

**Features:**
- Room name display
- User badge
- Visual hierarchy
- Connection status indicator

**Styling:**
- Responsive layout
- Color-coded room types
- Avatar support (via Avatar component)

**Example Usage:**
```tsx
<ChatHeader
  currentRoom={{ id: 0, name: "公共大厅", isPublic: true }}
  currentUser="alice123"
/>
```

---

## RoomSelector

**File:** `client/src/components/RoomSelector.tsx`

**Purpose:** Room switching interface.

**Props:**
```typescript
interface RoomSelectorProps {
  currentRoom: Room;
  onRoomChange: (room: Room) => void;
}
```

**Features:**
- Public lobby button
- Private room input
- Auto-join/create logic
- Error handling
- Current room display

**Workflow:**
1. User enters 6-digit code
2. System attempts to join room
3. If not found, creates new room
4. Updates current room state
5. Triggers room change callback

**Validation:**
- Room code must be 6 digits
- Only numeric characters allowed
- Error messages for invalid codes

**Example Usage:**
```tsx
<RoomSelector
  currentRoom={{ id: 0, name: "公共大厅", isPublic: true }}
  onRoomChange={(room) => {
    console.log('Switched to room:', room);
  }}
/>
```

---

## MessageList

**File:** `client/src/components/MessageList.tsx`

**Purpose:** Display chat messages with scroll management.

**Props:**
```typescript
interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  currentUser: string;
}
```

**Features:**
- Auto-scroll to bottom
- Message grouping
- Loading states
- Empty state handling
- Time formatting

**Scroll Behavior:**
- Auto-scrolls to new messages
- Preserves scroll position on update
- Uses `scrollIntoView` for smooth scrolling

**Message Grouping:**
- Groups consecutive messages from same user
- Displays timestamps at intervals
- Visual distinction between senders

**Example Usage:**
```tsx
<MessageList
  messages={messageList}
  isLoading={false}
  currentUser="alice123"
/>
```

---

## MessageBubble

**File:** `client/src/components/MessageBubble.tsx`

**Purpose:** Individual message display component.

**Props:**
```typescript
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReply?: (message: Message) => void;
}
```

**Features:**
- Different styles for own/other messages
- File attachment display
- Image preview
- Timestamp formatting
- Reply functionality (optional)

**Message Types:**
- **Text**: Plain text content
- **Image**: Image file with preview
- **File**: Generic file with download link

**Styling:**
- Own messages: Right-aligned, different color
- Other messages: Left-aligned, default color
- Avatar display for non-own messages

**File Handling:**
- Images: Inline preview
- Files: Icon + filename + size
- Download links for all files

**Example Usage:**
```tsx
<MessageBubble
  message={{
    id: 1,
    userId: "alice123",
    content: "Hello!",
    createdAt: "2024-01-01T12:00:00Z"
  }}
  isOwn={true}
  onReply={(msg) => console.log('Reply to:', msg)}
/>
```

---

## MessageInput

**File:** `client/src/components/MessageInput.tsx`

**Purpose:** Message composition interface.

**Props:**
```typescript
interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onFileUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
  maxLength?: number;
}
```

**Features:**
- Text input with character count
- File upload button
- Send button
- Keyboard shortcuts (Enter to send)
- Validation feedback

**Keyboard Shortcuts:**
- `Enter`: Send message
- `Shift + Enter`: New line
- `Escape`: Clear input

**Validation:**
- Character limit display
- Empty input prevention
- Disabled state handling

**File Upload:**
- Click attachment button
- Select file from device
- Upload to server
- Get file URL
- Create message with URL

**Example Usage:**
```tsx
<MessageInput
  onSendMessage={(content) => {
    console.log('Send:', content);
  }}
  onFileUpload={async (file) => {
    const response = await uploadFile(file);
    return response.fileUrl;
  }}
  disabled={false}
  maxLength={500}
/>
```

---

## ConnectionStatus

**File:** `client/src/components/ConnectionStatus.tsx`

**Purpose:** Display SSE connection state.

**Props:**
```typescript
interface ConnectionStatusProps {
  connectionState: 'connected' | 'connecting' | 'disconnected';
}
```

**States:**
- **Connected**: Green indicator, "已连接"
- **Connecting**: Yellow indicator, "连接中"
- **Disconnected**: Red indicator, "已断开"

**Features:**
- Visual status indicator
- Animated transitions
- Auto-hide when connected
- Manual reconnect option

**Display Logic:**
- Show when not connected
- Auto-hide after successful connection
- Persist error states

**Example Usage:**
```tsx
<ConnectionStatus
  connectionState="connected"
/>
```

---

## Aurora

**File:** `client/src/component/Aurora.tsx`

**Purpose:** Animated background effect.

**Features:**
- Gradient animation
- Smooth transitions
- Performance optimized
- Customizable colors

**Usage:**
```tsx
<Aurora />
```

**Customization:**
- Color palette
- Animation speed
- Blend mode

---

## UI Components

### Button

**File:** `client/src/components/ui/Button.tsx`

**Purpose:** Reusable button component.

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**Variants:**
- Primary: Main action buttons
- Secondary: Secondary actions
- Danger: Destructive actions

**Example Usage:**
```tsx
<Button
  variant="primary"
  size="medium"
  onClick={() => console.log('Clicked')}
>
  Send
</Button>
```

---

### Input

**File:** `client/src/components/ui/Input.tsx`

**Purpose:** Reusable input component.

**Props:**
```typescript
interface InputProps {
  type?: 'text' | 'password' | 'email';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
}
```

**Features:**
- Error state
- Disabled state
- Focus states
- Validation feedback

**Example Usage:**
```tsx
<Input
  type="text"
  placeholder="Enter room code"
  value={roomCode}
  onChange={setRoomCode}
  error={errorMessage}
/>
```

---

### Avatar

**File:** `client/src/components/ui/Avatar.tsx`

**Purpose:** User avatar display.

**Props:**
```typescript
interface AvatarProps {
  userId: string;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}
```

**Features:**
- Initial-based avatar
- Color coding
- Size options
- Name display

**Color Generation:**
- Deterministic color based on user ID
- Consistent colors for same user
- High contrast for readability

**Example Usage:**
```tsx
<Avatar
  userId="alice123"
  size="medium"
  showName={true}
/>
```

---

## Custom Hooks

### useResponsive

**File:** `client/src/hooks/useResponsive.ts`

**Purpose:** Responsive design breakpoint detection.

**Return Value:**
```typescript
{
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
}
```

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Usage:**
```tsx
const { isMobile, isDesktop } = useResponsive();

if (isMobile) {
  // Mobile-specific layout
}
```

---

## Context

### ChatContext

**File:** `client/src/context/ChatContext.tsx`

**Purpose:** Global chat state management.

**State:**
```typescript
interface ChatContextType {
  currentUser: string;
  currentRoom: Room;
  messages: Message[];
  isLoading: boolean;
  isConnected: boolean;
  setCurrentUser: (user: string) => void;
  setCurrentRoom: (room: Room) => void;
  setMessages: (messages: Message[]) => void;
  addMessages: (messages: Message[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsConnected: (connected: boolean) => void;
}
```

**Usage:**
```tsx
const { currentUser, currentRoom, addMessages } = useChatContext();

// Add new messages
addMessages([newMessage]);
```

---

## Utility Functions

### API Client

**File:** `client/src/utils/api.ts`

**Purpose:** HTTP client with Axios.

**Functions:**
```typescript
// Room API
roomAPI.getPublicRoom(): Promise<RoomResponse>;
roomAPI.createRoom(roomCode: string, userId: string): Promise<RoomResponse>;
roomAPI.joinRoom(roomCode: string): Promise<RoomResponse>;

// Message API
messageAPI.sendMessage(messageData: any): Promise<any>;
messageAPI.getMessages(roomId: number, lastMessageId?: number): Promise<MessagesResponse>;
messageAPI.getLatestMessages(roomId: number, limit?: number): Promise<MessagesResponse>;
```

**Features:**
- Request/response interceptors
- Error handling
- Timeout configuration
- Logging in development

**Example Usage:**
```typescript
const response = await messageAPI.sendMessage({
  roomId: 1,
  userId: 'alice123',
  content: 'Hello!'
});
```

---

### SSE Manager

**File:** `client/src/utils/SSEManager.ts`

**Purpose:** Server-Sent Events connection management.

**Class Methods:**
```typescript
class SSEManager {
  connect(roomId: number, userId: string): void;
  disconnect(): void;
  updateRoomId(newRoomId: number): void;
  isConnected(): boolean;
  getConnectionState(): string;
  destroy(): void;
}
```

**Constructor:**
```typescript
new SSEManager(
  onNewMessages?: (messages: Message[]) => void,
  onConnected?: (data: any) => void,
  onError?: (error: Event) => void
)
```

**Features:**
- Auto-reconnection (max 5 attempts)
- Exponential backoff
- Event handling
- Connection state tracking

**Example Usage:**
```typescript
const sseManager = new SSEManager(
  (messages) => setMessages(prev => [...prev, ...messages]),
  (data) => console.log('Connected:', data),
  (error) => console.error('Error:', error)
);

sseManager.connect(1, 'alice123');
```

---

## Styling

### CSS Modules

All components use CSS Modules for scoped styling.

**Naming Convention:**
```
ComponentName.module.css
```

**Example:**
```css
/* MessageBubble.module.css */
.bubble {
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 8px;
}

.own {
  background-color: #4A90E2;
  color: white;
  margin-left: auto;
}

.other {
  background-color: #f0f0f0;
  color: #333;
}
```

**Usage:**
```tsx
import styles from './MessageBubble.module.css';

<div className={`${styles.bubble} ${isOwn ? styles.own : styles.other}`}>
  {message.content}
</div>
```

### Global Styles

**File:** `client/src/styles/variables.css`

**CSS Variables:**
```css
:root {
  --primary: #4A90E2;
  --primary-dark: #357ABD;
  --success: #52C41A;
  --warning: #FAAD14;
  --error: #F5222D;

  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --text-primary: #333333;
  --text-secondary: #666666;
}
```

---

## Component Patterns

### Props Drilling vs Context

**Use Props:**
- Component-specific configuration
- Event handlers
- Display data

**Use Context:**
- Global application state
- User authentication
- Current room
- Message list

### Loading States

```tsx
if (isLoading) {
  return <LoadingSpinner />;
}
```

### Error Boundaries

```tsx
<ErrorBoundary>
  <ChatContainer />
</ErrorBoundary>
```

### Lazy Loading

```tsx
const LazyComponent = lazy(() => import('./LazyComponent'));

<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

---

## Performance Optimization

### React.memo

```tsx
const MessageBubble = React.memo(({ message, isOwn }) => {
  // Component implementation
});
```

### useCallback

```tsx
const handleSendMessage = useCallback((content: string) => {
  messageAPI.sendMessage({ ... });
}, [userId, roomId]);
```

### useMemo

```tsx
const sortedMessages = useMemo(() => {
  return messages.sort((a, b) => a.id - b.id);
}, [messages]);
```

---

## Testing

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import LoginForm from './LoginForm';

test('renders login form', () => {
  render(<LoginForm onLogin={jest.fn()} />);
  expect(screen.getByPlaceholderText(/用户名/i)).toBeInTheDocument();
});
```

### Integration Testing

```typescript
test('user can send message', async () => {
  render(<ChatContainer {...props} />);
  const input = screen.getByPlaceholderText(/输入消息/i);
  const button = screen.getByText(/发送/i);

  fireEvent.change(input, { target: { value: 'Hello' } });
  fireEvent.click(button);

  await waitFor(() => {
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## Common Patterns

### Form Handling

```tsx
const [value, setValue] = useState('');

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onSubmit(value);
  setValue('');
};

<form onSubmit={handleSubmit}>
  <input value={value} onChange={handleChange} />
  <button type="submit">Submit</button>
</form>
```

### API Calls

```tsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  setLoading(true);
  try {
    const response = await api.getData();
    setData(response.data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### Conditional Rendering

```tsx
{condition && <Component />}

{condition ? <ComponentA /> : <ComponentB />}

{condition && <ComponentA />}
{!condition && <ComponentB />}
```

---

## Accessibility

### ARIA Attributes

```tsx
<button
  aria-label="Send message"
  aria-pressed={false}
  role="button"
>
  Send
</button>
```

### Keyboard Navigation

```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick();
    }
  }}
  onClick={onClick}
>
  Clickable Div
</div>
```

---

## Migration Notes

### React 18 Features

- Automatic batching
- Suspense improvements
- Concurrent rendering support

### Upgrading Components

- Replace `useEffect` with `useLayoutEffect` where needed
- Use `useTransition` for non-blocking updates
- Implement `useDeferredValue` for heavy computations
