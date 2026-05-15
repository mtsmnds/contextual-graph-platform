import { useEditor, EditorContent, EditorContext } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { StarterKit } from "@tiptap/starter-kit"
import Document from "@tiptap/extension-document"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import Placeholder from "@tiptap/extension-placeholder"
import { Emoji } from "@tiptap/extension-emoji"
import DragHandle from "@tiptap/extension-drag-handle-react"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

const TitleDocument = Document.extend({
  content: "heading block+",
})

import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"
import "@/components/tiptap-templates/simple/simple-editor.scss"

import { Button } from "@/components/tiptap-ui-primitive/button"
import { useState, useEffect, useRef } from "react"
import Mention from "@tiptap/extension-mention"
import { useGraphStore } from "@/store/useGraphStore"
import { getRootContainers } from "@/engine/queries"

function parseContent(input: string, title?: string): string | Record<string, unknown> {
  if (!input) {
    return {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: title ? [{ type: "text", text: title }] : [],
        },
      ],
    }
  }
  try {
    return JSON.parse(input) as Record<string, unknown>
  } catch {
    return {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: title ? [{ type: "text", text: title }] : [],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: input }],
        },
      ],
    }
  }
}

function extractTitle(doc: Record<string, unknown> | null): string {
  if (!doc) return ""
  const content = (doc as { content?: Record<string, unknown>[] }).content
  if (content?.[0]?.type === "heading") {
    const textContent = (content[0] as { content?: Record<string, unknown>[] }).content
    return textContent?.map((n) => (n as { text?: string }).text ?? "").join("") ?? ""
  }
  return ""
}

interface TiptapEditorProps {
  content: string
  title?: string
  onSave?: (json: string) => void
  onTitleChange?: (title: string) => void
}

function TiptapEditor({ content, title, onSave, onTitleChange }: TiptapEditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">("main")
  const [showDragHandle, setShowDragHandle] = useState(true)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const onSaveRef = useRef(onSave)
  const onTitleChangeRef = useRef(onTitleChange)
  onSaveRef.current = onSave
  onTitleChangeRef.current = onTitleChange

  const lastTitleRef = useRef(title ?? "")
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
      handleDOMEvents: {
        blur: () => {
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
          const ed = editorRef.current
          if (ed) {
            const data = ed.getJSON()
            const currentTitle = extractTitle(data as Record<string, unknown>)
            if (currentTitle !== lastTitleRef.current) {
              lastTitleRef.current = currentTitle
              onTitleChangeRef.current?.(currentTitle)
            }
            onSaveRef.current?.(JSON.stringify(data))
          }
          return false
        },
      },
    },
    extensions: [
      StarterKit.configure({
        document: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      TitleDocument,
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Emoji,
      Mention.configure({
        HTMLAttributes: { class: "text-primary font-medium" },
        suggestion: {
          items: ({ query }) => {
            const state = useGraphStore.getState()
            return getRootContainers(state)
              .filter((e) => e.title?.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5)
          },
          render: () => {
            let dom: HTMLDivElement | null = null

            return {
              onStart: () => {
                dom = document.createElement("div")
                dom.className = "mention-suggestion"
                dom.textContent = "Loading..."
                document.body.appendChild(dom)
              },
              onUpdate: () => {},
              onExit: () => {
                if (dom) {
                  dom.remove()
                  dom = null
                }
              },
            }
          },
        },
      }),
    ],
    content: parseContent(content, title),
    onUpdate: ({ editor }) => {
      const data = editor.getJSON()
      const currentTitle = extractTitle(data as Record<string, unknown>)
      if (currentTitle !== lastTitleRef.current) {
        lastTitleRef.current = currentTitle
        onTitleChangeRef.current?.(currentTitle)
      }

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        onSaveRef.current?.(JSON.stringify(data))
      }, 1500)
    },
  })

  editorRef.current = editor

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      const ed = editorRef.current
      if (ed) {
        const data = ed.getJSON()
        const currentTitle = extractTitle(data as Record<string, unknown>)
        if (currentTitle !== lastTitleRef.current) {
          lastTitleRef.current = currentTitle
          onTitleChangeRef.current?.(currentTitle)
        }
        onSaveRef.current?.(JSON.stringify(data))
      }
    }
  }, [])

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  if (!editor) return null

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <>
              <Spacer />

              <ToolbarGroup>
                <UndoRedoButton action="undo" />
                <UndoRedoButton action="redo" />
              </ToolbarGroup>

              <ToolbarSeparator />

              <ToolbarGroup>
                <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
                <ListDropdownMenu
                  modal={false}
                  types={["bulletList", "orderedList", "taskList"]}
                />
                <BlockquoteButton />
                <CodeBlockButton />
              </ToolbarGroup>

              <ToolbarSeparator />

              <ToolbarGroup>
                <MarkButton type="bold" />
                <MarkButton type="italic" />
                <MarkButton type="strike" />
                <MarkButton type="code" />
                <MarkButton type="underline" />
                {!isMobile ? (
                  <ColorHighlightPopover editor={editor} />
                ) : (
                  <ColorHighlightPopoverButton onClick={() => setMobileView("highlighter")} />
                )}
                {!isMobile ? <LinkPopover editor={editor} /> : <LinkButton onClick={() => setMobileView("link")} />}
              </ToolbarGroup>

              <ToolbarSeparator />

              <ToolbarGroup>
                <MarkButton type="superscript" />
                <MarkButton type="subscript" />
              </ToolbarGroup>

              <ToolbarSeparator />

              <ToolbarGroup>
                <TextAlignButton align="left" />
                <TextAlignButton align="center" />
                <TextAlignButton align="right" />
                <TextAlignButton align="justify" />
              </ToolbarGroup>

              <ToolbarSeparator />

              <ToolbarGroup>
                <ImageUploadButton text="Add" />
              </ToolbarGroup>

              <Spacer />
            </>
          ) : (
            <>
              <ToolbarGroup>
                <Button variant="ghost" onClick={() => setMobileView("main")}>
                  <ArrowLeftIcon className="tiptap-button-icon" />
                  {mobileView === "highlighter" ? (
                    <HighlighterIcon className="tiptap-button-icon" />
                  ) : (
                    <LinkIcon className="tiptap-button-icon" />
                  )}
                </Button>
              </ToolbarGroup>

              <ToolbarSeparator />

              {mobileView === "highlighter" ? (
                <ColorHighlightPopoverContent editor={editor} />
              ) : (
                <LinkContent editor={editor} />
              )}
            </>
          )}
        </Toolbar>

        {editor && (
          <BubbleMenu editor={editor}>
            <div className="flex items-center gap-0.5 rounded-lg border bg-background px-1 py-0.5 shadow-sm">
              <MarkButton type="bold" />
              <MarkButton type="italic" />
              <MarkButton type="strike" />
              <MarkButton type="underline" />
              <ToolbarSeparator />
              <MarkButton type="code" />
            </div>
          </BubbleMenu>
        )}

        {editor && (
          <DragHandle
            editor={editor}
            onNodeChange={({ node, editor: ed }) => {
              const isTitle = node?.type.name === "heading" && ed?.state.doc.firstChild === node
              setShowDragHandle(!isTitle)
            }}
          >
            {showDragHandle && (
              <div className="drag-handle flex items-center justify-center w-4 cursor-grab text-muted-foreground hover:text-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="19" r="1"/></svg>
              </div>
            )}
          </DragHandle>
        )}

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}

export default TiptapEditor
