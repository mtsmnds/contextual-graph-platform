

plans for tiptap ui and features

we want to start with a basic tiptap experience. the intended features and style out of the box, before creating our own.
first, lets scaffold the starter ui and components. this is the moment to make plans on how to add extensions, components that didn't come with the starter kit. plan for the delta between the starter editing experience and the "notion-like" editing experience (just single-player features)
second, the schema. lets do things totally like tiptap and prosemirror does. for this lets leave our own schema "in the freezer" its best to test and leverage tiptap's features than try to build parity on our own! this is important and probably needs good planning to separate well and write documentation so any agent can pick it up later.

# ui and components 

0 
cli tools
https://tiptap.dev/docs/ui-components/getting-started/cli
use to scaffold the editor

1 
simple editor
https://tiptap.dev/docs/ui-components/templates/simple-editor
use the template

2 
check which components are in the simple editor and which arent
https://tiptap.dev/docs/ui-components/components/overview

3 
check which components they offer for free for the "notion" editing experience. i'm not talking about the multiplayer features, just the ui. specially the `/ commands`. and how everything is blocks that drag

4
styling
https://tiptap.dev/docs/ui-components/getting-started/style
attention to vite instructions

5 
check the performance guide as well
https://tiptap.dev/docs/guides/performance


# schema
we'll use the full tiptap schema as a test
https://tiptap.dev/docs/editor/core-concepts/schema

might wanna check
https://tiptap.dev/docs/editor/extensions/nodes
https://tiptap.dev/docs/editor/extensions/marks



# quality of life, extras

https://tiptap.dev/docs/editor/core-concepts/persistence


# questions
do i need to send all links one by one or you can "navigate" the web with web fetch, opening links as you see fit to complete your knowledge?

