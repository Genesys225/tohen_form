import tippy from "tippy.js";
/**
 * @param {Element | string} target
 */
export const popFactory = (target, options = {}) => {
  const title =
    // @ts-ignore
    options.title === null ? "" : target.name ? target.name : target.toString();
  const body = options.body === null ? "" : "this is a required field";
  const arrow = options.arrow ? true : false;
  const position =
    typeof options.position === "string" ? options.position : "top";
  if (typeof target === "string") {
    target = document.querySelector(target);
  }
  // @ts-ignore
  target.blur();
  const popper = tippy(target, {
    placement: position,
    content: body,
    trigger: "focus",
    arrow
  });
  // @ts-ignore
  target.focus();
  return { popper };
};
