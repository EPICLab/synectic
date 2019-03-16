import { Card } from '../../core/lib/Card';
import { Canvas } from '../../core/lib/Canvas';
import { Stack } from '../../core/lib/Stack';
import diff from 'fast-diff';
import ace from 'brace';
import 'brace/theme/monokai';
import { extname, readFileAsync, writeFileAsync } from '../../core/fs/io';
import { searchExt } from '../../core/fs/filetypes';
import { DateTime } from 'luxon';
import * as fs from 'fs-extra';
import * as git from 'isomorphic-git';
import * as sgit from '../../core/vcs/git';
// git.plugins.set('fs', fs);
import './editor.css';
import './modes';
import { SplitMode } from '../../core/lib/interaction';
import { CredentialManager, auth } from '../../core/vcs/CredentialManager';
import { Dialog } from '../../core/lib/Dialog';
// import * as path from 'path';

export class Editor extends Card {

  editor: ace.Editor;
  editorWindow: HTMLDivElement = document.createElement('div');
  private snapshot: string = '';
  private reverseContent: Map<string, HTMLElement> = new Map();

  /**
   * Default constructor for creating an Editor card.
   * @param parent A canvas or stack instance that will contain the new Editor card.
   * @param filename A valid filename or path to associate content with this Editor card.
   */
  constructor(parent: Canvas | Stack, filename: string) {
    super(parent, filename);

    this.element.classList.add('editor');
    this.editorWindow.setAttribute('id', (this.uuid + '-editor'));
    this.editorWindow.setAttribute('class', 'editor-window');
    this.front.appendChild(this.editorWindow);

    this.editor = ace.edit(this.uuid + '-editor');
    this.editor.setTheme('ace/theme/monokai');
    if (filename !== '') this.load();

    this.setReverseContent().then(() => {
      console.log('-----------------------');
    });
    this.editor.addEventListener('change', () => {
      this.modified = DateTime.local();
      this.hasUnsavedChanges();
    });
    fs.watch(this.filename, (_, filename) => {
      if (filename) {
        this.load();
      } else {
        console.log('filename not provided or check file access permissions');
      }
    });
  }

  /**
   * Writes content from Editor window to local file.
   */
  save(): void {
    if (this.filename === '') {
      // TODO: Prompt for a filename and filetype and proceed with save, instead of error.
      const message = 'This card is not associated with a filename, and cannot write to file.';
      new Dialog('snackbar', 'Editor Card Error: No Filename', message);
      return;
    }
    writeFileAsync(this.filename, this.editor.getValue())
      .then(() => {
        this.snapshot = this.editor.getValue();
        this.hasUnsavedChanges();
      })
      .catch(error => new Dialog('snackbar', 'Editor Card Error: Save Error', error.message));
  }

  /**
   * Reads local file content into this Editor card.
   */
  load(): void {
    if (this.filename === '') return; // no associated file to load
    Promise.all([readFileAsync(this.filename), searchExt(extname(this.filename))])
      .then(result => {
        const [content, filetype] = result;
        this.setContent(content);
        this.snapshot = content;
        if (filetype !== undefined) this.setMode(filetype.name);
      })
      .catch(error => new Dialog('snackbar', 'Editor Card Error: File Loading Failed', error.message));
  }

  /**
   * Compares the most recent snapshot with the content in the Editor window.
   * @return Boolean indicating that differences exist between snapshot and Editor content.
   */
  hasUnsavedChanges(): boolean {
    const changeset = diff(this.snapshot, this.editor.getValue());
    const nonEqualSets = changeset.filter(d => d[0] !== diff.EQUAL);
    if (nonEqualSets.length > 0) {
      this.toggleButton('saveButton', true);
      return true;
    } else {
      this.toggleButton('saveButton', false);
      return false;
    }
  }

  /**
   * Sets the Ace editor to display content.
   * @param content A string of content to be displayed in this card.
   */
  setContent(content: string): void {
    this.editor.setSession(new ace.EditSession(content));
  }

  /**
   * Sets the Ace editor mode for syntax highlighting and auto-completion.
   * @param mode The name of an Ace editor mode (e.g. JavaScript).
   */
  setMode(mode: string): void {
    this.editor.getSession().setMode('ace/mode/' + mode.toLowerCase());
  }

  async setReverseContent() {
    let myHTMLObj = document.createElement('span');
    myHTMLObj.innerHTML = '<b>' + 'stuff' + '</b>';
    this.element.appendChild(myHTMLObj);

    console.log('this.filename: ' + this.filename);
    let repoRoot = await sgit.getRepoRoot(this.filename);
    let repoLabel = document.createElement('span');
    let repoField = document.createElement('span');
    repoLabel.innerText = 'Path:';
    repoField.innerText = repoRoot;
    this.addBack(repoLabel, repoField);

    const current = await git.currentBranch({dir: repoRoot, fullname: false});
    let branches = await sgit.getAllBranches(repoRoot);
    console.log('branches: [' + branches.length + '] ' + branches);
    console.log('current branch: ' + current);

    let remoteRefs = await sgit.getRemotes(repoRoot);
    remoteRefs.map(ref => {
      console.log('remote: ' + ref.remote + ', url: ' + ref.url);
    });
    let origin: git.RemoteDefinition = remoteRefs[0];
    console.log('origin: ' + origin.url);

    let cm: CredentialManager = global.Synectic.credentialManager;
    let auth = await cm.fill(origin.url);
    let xAuth = auth as auth;
    console.log('fill:');
    console.log('oauth2format: ' + xAuth.oauth2format);
    console.log('username: ' + xAuth.username);
    console.log('password: ' + xAuth.password);
    console.log('token: ' + xAuth.token);

    // let httpsURL = CredentialManager.toHTTPS(origin.url);
    // await git.fetch({ dir: repoRoot, url: httpsURL });
    // console.log('fetch is done');


    await git.fetch({
      dir: '../isomorphic-git/',
      // corsProxy: 'https://cors.isomorphic-git.org',
      url: 'https://github.com/isomorphic-git/isomorphic-git',
      ref: 'master',
      depth: 1,
      singleBranch: true,
      tags: false
    })
    console.log('fetch is done')
    // console.log('defaultBranch: ' + fetchRes.defaultBranch);

    // let branchLabel = document.createElement('span');
    // let branchField = document.createElement('select');
    // branchLabel.innerText = 'branch';
    // for (let branch in localBranches) {
    //   let option = document.createElement('option');
    //   option.innerText = localBranches[branch];
    //   localField.appendChild(option);
    //   if (current === option.innerText) {
    //     localField.options[branch].selected = true;
    //   }
    // }
    // this.addBack(localLabel, localField);


    // git.findRoot({ filepath: this.filename })
    //   .then(gitroot => {
    //     // global.Synectic.gitEvents.addEventListener('gitroot', () => {
    //     //   console.log('firing gitroot event');
    //     // });
    //     // this.addReverseContent('Root', gitroot);
    //     let rel_path = path.relative(gitroot, this.filename);
    //     this.addReverseContent('Path', rel_path);
    //
    //     // git.listFiles({ dir: gitroot })
    //     //   .then(files => {
    //     //     this.addReverseContent('VCS Managed', (files.indexOf(rel_path) > -1).toString());
    //     //   })
    //     //   .catch(() => console.log('Git files not available'));
    //
    //     // git.currentBranch({dir: gitroot, fullname: false})
    //     //   .then(branch => {
    //     //     if (branch !== undefined) {
    //     //       this.addReverseContent('Branch', branch);
    //     //     }
    //     //   })
    //     //   .catch(() => console.log('Git branch not available'));
    //
    //     git.listBranches({ dir: gitroot })
    //       .then(branches => {
    //         console.log(branches);
    //         let branchList = this.addReverseContentList('Branch', branches);
    //         git.currentBranch({dir: gitroot, fullname: false})
    //           .then(branch => {
    //             for (var i = 0; i < branchList.options.length; ++i) {
    //               if (branchList.options[i].text === branch)
    //                 branchList.options[i].selected = true;
    //             }
    //           });
    //       });
    //   })
    //   .catch(() => console.log('Unable to execute git command'));

    // isGitRepoAsync(path.dirname(this.filename))
    //   .then(status => {
    //     this.addReverse('Path', path.resolve(path.join(path.dirname(this.filename), '/.git')));
    //     this.addReverse('VCS', status.toString());
    //   })
    //   .catch(() => {
    //     this.addReverse('VCS', '[failed check]');
    //   });
  }

  addReverseContent(key: string, value: string): void {
    let label = document.createElement('span');
    let field = document.createElement('span');
    label.setAttribute('class', 'label');
    field.setAttribute('class', 'field');
    label.innerText = key;
    field.innerText = value;
    this.back.appendChild(label);
    this.back.appendChild(field);
    this.reverseContent.set(key, field);
  }

  addReverseContentList(key: string, values: string[]): HTMLSelectElement {
    let label = document.createElement('span');
    let field = document.createElement('select');
    label.setAttribute('class', 'label');
    field.setAttribute('class', 'field');
    label.innerText = key;
    for (let value in values) {
      console.log('list item: ' + values[value]);
      let option = document.createElement('option');
      option.value = values[value];
      option.innerText = values[value];
      field.appendChild(option);
    }
    this.back.appendChild(label);
    this.back.appendChild(field);
    this.reverseContent.set(key, field);
    return field;
  }

  updateReverseContent(key: string, newValue: string): boolean {
    let field: HTMLElement | undefined = this.reverseContent.get(key);
    if (field !== undefined) {
      field.innerText = newValue;
      return true;
    } else {
      return false;
    }
  }

  resize(): void {
    super.resize();
    this.editor.resize();
  }

  split(mode: SplitMode): void {
    super.split(mode);
    this.editor.resize();
  }
}
