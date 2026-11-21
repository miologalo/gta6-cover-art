// Vice Cover Studio — entry point: starts the editor once the page is ready.
import { createEditor } from './editor.js';

const editor = createEditor(document);
// Exposed for screenshots and tests: window.__viceCover.editor
window.__viceCover = { editor };
