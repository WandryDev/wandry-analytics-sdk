export const mockRegistryItem = {
  name: "button",
  title: "Button Component",
  description: "A customizable button component with various styles and sizes",
  files: [
    {
      path: "components/ui/button.tsx",
      content: "export const Button = () => <button>Click me</button>",
    },
  ],
  dependencies: ["react"],
  registryDependencies: [],
};

export const mockRegistryItemWithMultipleFiles = {
  name: "card",
  title: "Card Component",
  description: "A flexible card component for displaying content",
  files: [
    {
      path: "components/ui/card.tsx",
      content: "export const Card = () => <div>Card</div>",
    },
    {
      path: "components/ui/card-header.tsx",
      content: "export const CardHeader = () => <div>Header</div>",
    },
  ],
  dependencies: ["react", "clsx"],
  registryDependencies: [],
};

export const mockRegistryItemWithSpecialChars = {
  name: "alert-dialog",
  title: "Alert & Dialog Component",
  description:
    "A modal dialog that interrupts the user with important content and expects a response. Uses <dialog> element.",
  files: [
    {
      path: "components/ui/alert-dialog.tsx",
      content: "export const AlertDialog = () => <dialog>Alert</dialog>",
    },
  ],
  dependencies: ["react"],
  registryDependencies: [],
};

export const mockRegistry = {
  name: "test-registry",
  items: [
    mockRegistryItem,
    mockRegistryItemWithMultipleFiles,
    mockRegistryItemWithSpecialChars,
  ],
};

export const mockEmptyRegistry = {
  name: "empty-registry",
  items: [],
};

export const mockRegistryWithoutItems = {
  name: "no-items-registry",
};

export const mockLargeRegistry = {
  name: "large-registry",
  items: Array.from({ length: 50 }, (_, index) => ({
    name: `component-${index}`,
    title: `Component ${index}`,
    description: `Description for component ${index}`,
    files: [
      {
        path: `components/ui/component-${index}.tsx`,
        content: `export const Component${index} = () => <div>Component ${index}</div>`,
      },
    ],
    dependencies: ["react"],
    registryDependencies: [],
  })),
};

export const mockRegistryUrl = "https://example.com/r/registry.json";
export const mockBaseUrl = "https://example.com";
