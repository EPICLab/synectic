import { Card } from '../../core/lib/Card';
import { Canvas } from '../../core/lib/Canvas';
import { Stack } from '../../core/lib/Stack';

//import { DateTime } from 'luxon';
import * as fs from 'fs-extra';
import * as git from 'isomorphic-git';
git.plugins.set('fs', fs);
import './fileexplorer.css';
import { SplitMode } from '../../core/lib/interaction';
//import * as path from 'path';

export class FileExplorer extends Card {

  primaryContainerElement: HTMLDivElement = document.createElement('div');
  directorypath: String | null = null;
  gitcommit_id: String | null = null;

  /**
   * Default constructor for creating a FileExplorer card.
   * @param parent A canvas or stack instance that will contain the new FileExplorer card.
   * @param directory A valid directory path to associate content with this FileExplorer card.
   * @param gitrevision A commit ID that if specified will browse files at that commit,
   *                    causes editor cards spawned to reference read-only file from commit
   */
  constructor(parent: Canvas | Stack, directory: string) {
    super(parent, directory);
    this.directorypath = directory;

    this.element.classList.add('fileexplorer');
    this.primaryContainerElement.setAttribute('id', (this.uuid + '-fileexplorer'));
    this.primaryContainerElement.setAttribute('class', 'fileexplorer-window');
    this.front.appendChild(this.primaryContainerElement);

    // TODO proper exception / notification if directory is not specified:
    if (
      directory == '' ||
      directory === undefined
    ) {
      console.error("FileExplorer: directory is", directory);
      // TODO raise
      return
    }

    this.load();

    //this.setReverseContent();
    fs.watch(this.filename, (_, directory) => {
      if (directory) {
        this.load();
      } else {
        console.log('could not open directory');
      }
    });
  }

  /**
   * Read the directory structure and populate the element.
   */
  load(): void {
    // TODO
  }

  /**
   * FileExplorer doesn't have any changes to save.
   * @return Boolean
   */
  hasUnsavedChanges(): boolean {
    return false;
  }

  /**
   * FileExplorer has nothing to save.
   */
  save(): void {
    return;
  }

  resize(): void {
    super.resize();
    //this.editor.resize();
  }

  split(mode: SplitMode): void {
    super.split(mode);
    //this.editor.resize();
  }
}
