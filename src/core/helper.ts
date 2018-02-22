export function hasClass(el: HTMLElement, className: string): boolean {
  return el.classList ? el.classList.contains(className)
    : new RegExp('\\b' + className + '\\b').test(el.className);
}

export function addClass(el: HTMLElement, className: string): void {
  if (el.classList) el.classList.add(className);
  else if (!hasClass(el, className)) el.className += ' ' + className;
}

export function removeClass(el: HTMLElement, className: string): void {
  let exp: RegExp = new RegExp('\\b' + className + '\\b', 'g');
  if (el.classList) el.classList.remove(className);
  else el.className = el.className.replace(exp, '');
}
