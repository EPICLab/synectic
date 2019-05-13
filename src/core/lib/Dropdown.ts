import '../../asset/style/dropmenu.css';
import { hasClass, toggleClass, removeClass, addClass } from "./helper";

export class Dropdown {

  name: string;
  menu: HTMLDivElement = document.createElement('div');
  btn: HTMLButtonElement = document.createElement('button');
  content: HTMLDivElement = document.createElement('div');
  options: Map<string, HTMLButtonElement> = new Map();

  constructor(name: string, selected?: HTMLButtonElement) {
    this.name = name;
    this.menu.setAttribute('class', 'dropdown');
    this.menu.setAttribute('id', 'dropdown');
    this.btn.setAttribute('class', 'dropdown-button');
    this.content.setAttribute('class', 'dropdown-content');
    this.content.setAttribute('id', 'dropdown-menu');
    this.menu.appendChild(this.btn);
    this.menu.appendChild(this.content);

    this.btn.innerText = name;

    this.btn.onclick = () => {
      if (!hasClass(this.content, 'show')) {
        document.addEventListener('mousedown', (e) => this.clickEvent(e), {once: true});
      }
      toggleClass(this.content, 'show');
    };
    if (selected) this.selected(selected.id);
  }

  add(option: HTMLButtonElement): void {
    if (this.options.has(option.id)) return;
    option.addEventListener('click', () => {
      document.addEventListener('mousedown', (e) => this.clickEvent(e), {once: true});
      this.selected(option.id);
    }, false);
    this.content.appendChild(option);
    this.options.set(option.id, option);
  }

  remove(option: HTMLButtonElement | string): boolean {
    if (option instanceof HTMLButtonElement) {
      return this.options.delete(option.id);
    } else {
      return this.options.delete(option);
    }
  }

  selected(id: string): void {
    const newSelected = this.options.get(id);
    if (newSelected) {
      if (hasClass(newSelected, 'checked')) {
        this.clear();
        this.btn.innerText = this.name;
      } else {
        this.clear();
        addClass(newSelected, 'checked');
        this.btn.innerText = newSelected.id;
      }
      removeClass(this.content, 'show');
    }
  }

  clear(): void {
    this.options.forEach(opt => removeClass(opt, 'checked'));
  }

  clickEvent(e: MouseEvent) {
    const [X, Y] = [e.clientX, e.clientY];
    const rect = this.content.getBoundingClientRect();
    if (X < rect.left || X > rect.right || Y < rect.top || Y > rect.bottom) {
      removeClass(this.content, 'show');
    }
  }

}
