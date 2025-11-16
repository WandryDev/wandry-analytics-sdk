![Wandry Inertia Form](public/hero.png)

# @wandry/analytics-sdk

SDK for Wandry Analytics - a powerful analytics platform for shadcn registry.

## Purpose

The **@wandry/analytics-sdk** is a TypeScript SDK designed to provide essential tools for managing and analyzing shadcn/ui registries. It serves as a bridge between your registry infrastructure and analytics capabilities, enabling developers to track component usage and generate RSS feeds for their component libraries.

## Why This SDK Exists

When building a shadcn/ui registry, developers need:

- **RSS Feed Generation**: Allow users and applications to subscribe to updates and track new components or changes in your registry. RSS feeds enable better discoverability and keep the community informed about registry updates.

- **Analytics Tracking**: Monitor which components are being installed and used from your registry. This provides valuable insights into component popularity and helps prioritize development efforts.

- **Automatic Type Detection**: Intelligently categorize registry items as components or blocks based on their structure, ensuring correct URL generation and proper organization in RSS feeds.

## Key Features

### RSS Feed Generation

The SDK automatically generates RSS 2.0 compliant feeds from your `registry.json` file. It intelligently detects whether each item is a component or block, generating appropriate URLs for each. The RSS generator supports multiple publication date strategies, including current date, file modification time, GitHub commit dates, or custom date calculation functions.

### Analytics Event Tracking

Tracks component installation events from your registry. The SDK validates requests, anonymizes IP addresses for privacy, and sends events to the Wandry Analytics API. This enables registry maintainers to understand component adoption patterns.

### Intelligent Type Detection

Automatically determines whether registry items are components or blocks by analyzing multiple factors:

- Item type field (`registry:ui`, `registry:component`, `registry:block`, `registry:page`)
- File path patterns (`/ui/`, `/components/`, `/blocks/`)
- File type properties

The detection algorithm prioritizes path patterns over type fields, ensuring accurate categorization even when metadata is inconsistent. For example, if a path contains `/blocks/`, the item is classified as a block, regardless of its type field value.

### Integration Ready

Designed specifically for Next.js applications, the SDK can be integrated via middleware or API routes. It automatically detects the base URL from requests and supports modern serverless deployment patterns.

## Target Audience

This SDK is intended for:

- Registry maintainers who want to provide RSS feeds for their component libraries
- Developers building shadcn/ui registries who need analytics capabilities
- Teams looking to track component adoption and usage patterns
- Projects that need automatic type detection for proper URL generation

## Installation

```bash
npm install @wandry/analytics-sdk
```

## Technical Overview

The SDK is built with TypeScript and provides type-safe APIs. It includes comprehensive test coverage with integration tests that validate type detection across real-world registry data. The architecture is modular, separating concerns between RSS generation, analytics tracking, and utility functions.

For detailed usage instructions and API documentation, refer to the `RSS_USAGE.md` file included in the project.
