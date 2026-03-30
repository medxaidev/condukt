# @prismui/demo

**Interactive demo application for PrismUI Runtime Platform**

## Overview

This is the interactive demo showcasing all PrismUI runtime capabilities. Each page demonstrates a specific module or feature.

## Pages

| Page                 | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| **Overview**         | Architecture overview and quick links                             |
| **Page Module**      | Page navigation and transitions                                   |
| **Modal Module**     | Modal stack management                                            |
| **Drawer Module**    | Drawer positioning and stack                                      |
| **Notifications**    | Toast notification system                                         |
| **Form & Async**     | Form state and async operations                                   |
| **Interaction DSL**  | Unified `ui.*` API                                                |
| **Governance**       | Audit trail, policy engine, replay                                |
| **Rendering Layer**  | ModalRenderer, DrawerRenderer, NotificationRenderer               |
| **Workflow Runtime** | Multi-step workflow orchestration with confirm/notify/async steps |

## Development

```bash
# From monorepo root
cd packages/demo

# Start dev server
npm run dev

# Build for production
npm run build
```

## Version

- **Current**: 0.3.0
- **Dependencies**: @prismui/core 0.3.0, @prismui/react 0.3.0
