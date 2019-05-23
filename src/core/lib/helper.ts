/**
 * Helper function to check for the existence of a CSS class on an HTML element.
 * @param el Target HTML element to check for CSS class.
 * @param className CSS class name to be checked in CSS class list of target.
 */
export function hasClass(el: HTMLElement, className: string): boolean {
  return el.classList ? el.classList.contains(className)
    : new RegExp('\\b' + className + '\\b').test(el.className);
}

/**
 * Helper function to add a CSS class to an HTML element.
 * @param el Target HTML element to add CSS class.
 * @param className CSS class name to be added to target; there is no effect if
 * CSS class is already present in the CSS class list of target.
 */
export function addClass(el: HTMLElement, className: string): void {
  if (el.classList) el.classList.add(className);
  else if (!hasClass(el, className)) el.className += ' ' + className;
}

/**
 * Helper function to remove CSS class from an HTML element.
 * @param el Target HTML element to remove CSS class.
 * @param className CSS class to be removed from target; there is no effect if CSS
 * class is not present in the CSS class list of target.
 */
export function removeClass(el: HTMLElement, className: string): void {
  const exp: RegExp = new RegExp('\\b' + className + '\\b', 'g');
  if (el.classList) el.classList.remove(className);
  else el.className = el.className.replace(exp, '');
}

/**
 * Helper function to toggle CSS class from an HTML element; adding if CSS class
 * is not already added, or removing CSS class if previously added.
 */
export function toggleClass(el: HTMLElement, className: string): void {
  if (hasClass(el, className)) removeClass(el, className);
  else addClass(el, className);
}

/**
 * Helper function for applying a mixin into a class. This will run through the
 * properties of each of the mixins and copy them over to the target of the
 * mixins, filling out the stand-in properties with their implementations.
 * @param derivedCtor Target class to apply mixins.
 * @param baseCtors List of mixin classes to apply into target class.
 */
export function applyMixins(derivedCtor: any, baseCtors: any[]): void {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      const attr = Object.getOwnPropertyDescriptor(baseCtor.prototype, name);
      if (attr) Object.defineProperty(derivedCtor.prototype, name, attr);
    });
  });
}

/**
 * Toggle the show/hide state visibility state of an HTMLElement contained within this card.
 * @param elem HTMLElement or deriving child element types.
 * @param visiblity Optional setting for explicitly setting show/hide state;
 * true shows the element, false hides the element.
 */
export function toggleVisibility(elem: HTMLElement, visiblity?: boolean): void {
  switch (visiblity) {
  case true:
    $(elem).show();
    break;
  case false:
    $(elem).hide();
    break;
  default:
    $(elem).toggle();
  }
}
