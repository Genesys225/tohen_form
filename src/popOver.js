import tippy from 'tippy.js';

export const popFactory = (target, options = {}) => {
    options.title === null ? '' : target.name ? target.name : target.toString();
    const body = options.body === null ? '' : 'this is a required field';
    const arrow = options.arrow ? true : false;
    const position =
    typeof options.position === 'string' ? options.position : 'top';
    if (typeof target === 'string') {
        target = document.querySelector(target);
    }
    target.blur();
    const popper = tippy(target, {
        placement: position,
        content: body,
        trigger: 'focus',
        arrow
    });
    target.focus();
    return { popper };
};
