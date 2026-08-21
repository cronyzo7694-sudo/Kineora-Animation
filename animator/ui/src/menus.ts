// ============================================================================
// MENU TREE — the complete professional menu bar (Blueprint Part 01 §1.2,
// verified against Adobe Animate: File Edit View Insert Modify Text Commands
// Control Debug Window Help). Every item references a command id from
// commands.ts; MenuBar resolves enabled/checked/shortcut/status from the
// registry, so a menu item can never diverge from its command.
// ============================================================================

export type MenuEntry =
  | { type: 'command'; id: string }
  | { type: 'submenu'; label: string; items: MenuEntry[] }
  | { type: 'separator' }
  /** Dynamic list of saved workspaces (each runs workspace.load with its name). */
  | { type: 'workspaceList' }
  /** Dynamic list of recent files (each runs file.open with its title). */
  | { type: 'recentList' }

export interface MenuDef {
  id: string
  label: string
  items: MenuEntry[]
}

const sep: MenuEntry = { type: 'separator' }

export const menus: MenuDef[] = [
  {
    id: 'menu.file',
    label: 'File',
    items: [
      { type: 'command', id: 'file.new' },
      { type: 'command', id: 'file.newFromTemplate' },
      { type: 'command', id: 'file.open' },
      { type: 'submenu', label: 'Open Recent', items: [{ type: 'recentList' }] },
      { type: 'command', id: 'file.openExternalLibrary' },
      sep,
      { type: 'command', id: 'file.close' },
      { type: 'command', id: 'file.closeAll' },
      sep,
      { type: 'command', id: 'file.save' },
      { type: 'command', id: 'file.saveAs' },
      { type: 'command', id: 'file.saveAsTemplate' },
      sep,
      {
        type: 'submenu',
        label: 'Import',
        items: [
          { type: 'command', id: 'file.importStage' },
          { type: 'command', id: 'file.importLibrary' },
          { type: 'command', id: 'file.openExternalLibrary' },
        ],
      },
      {
        type: 'submenu',
        label: 'Export',
        items: [
          { type: 'command', id: 'file.export' },
          { type: 'command', id: 'file.exportVideo' },
          { type: 'command', id: 'file.exportGif' },
          { type: 'command', id: 'file.exportMovie' },
          { type: 'command', id: 'file.exportSequence' },
        ],
      },
      {
        type: 'submenu',
        label: 'Publish',
        items: [
          { type: 'command', id: 'file.publishSettings' },
          { type: 'command', id: 'file.publish' },
          { type: 'command', id: 'file.publishProfiles' },
        ],
      },
      sep,
      { type: 'command', id: 'file.exit' },
    ],
  },
  {
    id: 'menu.edit',
    label: 'Edit',
    items: [
      { type: 'command', id: 'edit.undo' },
      { type: 'command', id: 'edit.redo' },
      sep,
      { type: 'command', id: 'edit.cut' },
      { type: 'command', id: 'edit.copy' },
      { type: 'command', id: 'edit.paste' },
      { type: 'command', id: 'edit.pasteInPlace' },
      { type: 'command', id: 'edit.duplicate' },
      sep,
      { type: 'command', id: 'edit.selectAll' },
      { type: 'command', id: 'edit.deselectAll' },
      sep,
      { type: 'command', id: 'edit.findReplace' },
      sep,
      {
        type: 'submenu',
        label: 'Timeline',
        items: [
          { type: 'command', id: 'timeline.cut' },
          { type: 'command', id: 'timeline.copy' },
          { type: 'command', id: 'timeline.paste' },
          { type: 'command', id: 'timeline.clear' },
          { type: 'command', id: 'timeline.remove' },
          sep,
          { type: 'command', id: 'timeline.reverse' },
          { type: 'command', id: 'timeline.duplicate' },
          { type: 'command', id: 'timeline.convert' },
          { type: 'command', id: 'timeline.convertBlank' },
        ],
      },
      sep,
      { type: 'command', id: 'edit.preferences' },
      { type: 'command', id: 'help.shortcuts' },
    ],
  },
  {
    id: 'menu.view',
    label: 'View',
    items: [
      {
        type: 'submenu',
        label: 'Go To',
        items: [
          { type: 'command', id: 'control.firstFrame' },
          { type: 'command', id: 'control.stepBackward' },
          { type: 'command', id: 'control.stepForward' },
          { type: 'command', id: 'control.lastFrame' },
        ],
      },
      sep,
      { type: 'command', id: 'view.zoomIn' },
      { type: 'command', id: 'view.zoomOut' },
      { type: 'command', id: 'view.zoom100' },
      { type: 'command', id: 'view.zoomFit' },
      sep,
      {
        type: 'submenu',
        label: 'Preview Mode',
        items: [
          { type: 'command', id: 'view.previewFull' },
          { type: 'command', id: 'view.previewOutline' },
        ],
      },
      sep,
      { type: 'command', id: 'view.workArea' },
      sep,
      { type: 'command', id: 'view.rulers' },
      { type: 'command', id: 'view.grid' },
      { type: 'command', id: 'view.guides' },
      sep,
      { type: 'command', id: 'view.snapping' },
      { type: 'command', id: 'view.hideEdges' },
    ],
  },
  {
    id: 'menu.insert',
    label: 'Insert',
    items: [
      { type: 'command', id: 'insert.newSymbol' },
      sep,
      {
        type: 'submenu',
        label: 'Timeline',
        items: [
          { type: 'command', id: 'timeline.insertframe' },
          { type: 'command', id: 'timeline.keyframe' },
          { type: 'command', id: 'timeline.blank' },
          sep,
          { type: 'command', id: 'timeline.deleteframe' },
          { type: 'command', id: 'timeline.clear' },
        ],
      },
      sep,
      { type: 'command', id: 'insert.motionTween' },
      { type: 'command', id: 'insert.classicTween' },
      { type: 'command', id: 'insert.shapeTween' },
      sep,
      { type: 'command', id: 'insert.scene' },
    ],
  },
  {
    id: 'menu.modify',
    label: 'Modify',
    items: [
      { type: 'command', id: 'modify.document' },
      sep,
      { type: 'command', id: 'modify.convertSymbol' },
      { type: 'command', id: 'modify.breakApart' },
      sep,
      {
        type: 'submenu',
        label: 'Symbol',
        items: [
          { type: 'command', id: 'modify.swapSymbol' },
          { type: 'command', id: 'modify.duplicateSymbol' },
        ],
      },
      {
        type: 'submenu',
        label: 'Bitmap',
        items: [{ type: 'command', id: 'modify.bitmapTrace' }],
      },
      {
        type: 'submenu',
        label: 'Shape',
        items: [
          { type: 'command', id: 'modify.shapeConvertLines' },
          { type: 'command', id: 'modify.shapeExpand' },
          { type: 'command', id: 'modify.shapeSoften' },
        ],
      },
      {
        type: 'submenu',
        label: 'Combine Objects',
        items: [
          { type: 'command', id: 'modify.combineUnion' },
          { type: 'command', id: 'modify.combineIntersect' },
          { type: 'command', id: 'modify.combinePunch' },
          { type: 'command', id: 'modify.combineCrop' },
        ],
      },
      {
        type: 'submenu',
        label: 'Timeline',
        items: [
          { type: 'command', id: 'timeline.reverse' },
          { type: 'command', id: 'timeline.convert' },
          { type: 'command', id: 'timeline.convertBlank' },
        ],
      },
      sep,
      {
        type: 'submenu',
        label: 'Transform',
        items: [
          { type: 'command', id: 'modify.freeTransform' },
          { type: 'command', id: 'modify.transformScale' },
          { type: 'command', id: 'modify.transformRotate90cw' },
          { type: 'command', id: 'modify.transformRotate90ccw' },
          { type: 'command', id: 'modify.transformFlipH' },
          { type: 'command', id: 'modify.transformFlipV' },
          { type: 'command', id: 'modify.transformRemove' },
        ],
      },
      {
        type: 'submenu',
        label: 'Arrange',
        items: [
          { type: 'command', id: 'modify.arrangeFront' },
          { type: 'command', id: 'modify.arrangeForward' },
          { type: 'command', id: 'modify.arrangeBackward' },
          { type: 'command', id: 'modify.arrangeBack' },
        ],
      },
      { type: 'command', id: 'modify.align' },
      sep,
      { type: 'command', id: 'modify.group' },
      { type: 'command', id: 'modify.ungroup' },
    ],
  },
  {
    id: 'menu.text',
    label: 'Text',
    items: [
      { type: 'command', id: 'text.font' },
      { type: 'command', id: 'text.size' },
      {
        type: 'submenu',
        label: 'Style',
        items: [
          { type: 'command', id: 'text.styleBold' },
          { type: 'command', id: 'text.styleItalic' },
        ],
      },
      {
        type: 'submenu',
        label: 'Align',
        items: [
          { type: 'command', id: 'text.alignLeft' },
          { type: 'command', id: 'text.alignCenter' },
          { type: 'command', id: 'text.alignRight' },
          { type: 'command', id: 'text.alignJustify' },
        ],
      },
      sep,
      { type: 'command', id: 'text.letterSpacing' },
      { type: 'command', id: 'text.lineSpacing' },
      sep,
      { type: 'command', id: 'text.embedFonts' },
    ],
  },
  {
    id: 'menu.commands',
    label: 'Commands',
    items: [
      { type: 'command', id: 'commands.runSaved' },
      sep,
      { type: 'command', id: 'commands.copyMotion' },
      { type: 'command', id: 'commands.exportMotion' },
      { type: 'command', id: 'commands.importMotion' },
      sep,
      { type: 'command', id: 'commands.runScript' },
    ],
  },
  {
    id: 'menu.control',
    label: 'Control',
    items: [
      { type: 'command', id: 'timeline.play' },
      { type: 'command', id: 'control.stop' },
      { type: 'command', id: 'control.rewind' },
      sep,
      { type: 'command', id: 'control.stepForward' },
      { type: 'command', id: 'control.stepBackward' },
      { type: 'command', id: 'control.nextKeyframe' },
      { type: 'command', id: 'control.prevKeyframe' },
      { type: 'command', id: 'control.firstFrame' },
      { type: 'command', id: 'control.lastFrame' },
      sep,
      { type: 'command', id: 'control.loop' },
      { type: 'command', id: 'control.mute' },
      sep,
      { type: 'command', id: 'control.test' },
    ],
  },
  {
    id: 'menu.debug',
    label: 'Debug',
    items: [
      { type: 'command', id: 'panel.debug' },
      sep,
      { type: 'command', id: 'debug.as3' },
    ],
  },
  {
    id: 'menu.window',
    label: 'Window',
    items: [
      { type: 'command', id: 'panel.tools' },
      { type: 'command', id: 'panel.timeline' },
      { type: 'command', id: 'panel.layers' },
      { type: 'command', id: 'panel.properties' },
      { type: 'command', id: 'panel.library' },
      { type: 'command', id: 'panel.debug' },
      sep,
      {
        type: 'submenu',
        label: 'Workspaces',
        items: [
          { type: 'command', id: 'workspace.saveCurrent' },
          { type: 'command', id: 'workspace.saveNew' },
          { type: 'command', id: 'window.resetWorkspace' },
          sep,
          { type: 'workspaceList' },
        ],
      },
      { type: 'command', id: 'window.workspacePresets' },
    ],
  },
  {
    id: 'menu.help',
    label: 'Help',
    items: [
      { type: 'command', id: 'help.shortcuts' },
      { type: 'command', id: 'help.docs' },
      { type: 'command', id: 'help.troubleshoot' },
      sep,
      { type: 'command', id: 'help.about' },
    ],
  },
]
