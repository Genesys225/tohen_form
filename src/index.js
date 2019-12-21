import { LitElement, html, css } from "lit-element";
import { popFactory } from "./popOver";
import { createMachine, interpret, assign } from "@xstate/fsm";
/** @typedef {import("../node_modules/@xstate/fsm/dist/types").Typestate } ctx */
/** @typedef {import("../node_modules/@xstate/fsm/dist/types").StateMachine.Machine } formStateMachine */
const formStateMachine = createMachine({
  id: "formStateMachine",
  initial: "idle",
  context: { focused: false },
  states: {
    idle: { on: { SLOTTED: "initiated" } },
    initiated: { on: { FOCUS: "inputFocused" } },
    inputFocused: {
      on: {
        FOCUS: {
          target: "inputFocused",
          actions: assign({
            /** @param {TContext} context */
            focused: (context, event) => {
              console.log("keep focusing", context, event);
              return true;
            }
          })
        }
      }
    }
  }
});

const { initialState } = formStateMachine;
/**
 *
 *
 * @class Tofes
 * @extends {LitElement}
 */
class Tofes extends LitElement {
  static formAssociated = true;

  static get properties() {
    return {
      state: { type: Object },
      showSubmit: { type: Boolean, reflect: true },
      confirmText: { type: String, reflect: true },
      name: { type: String, reflect: true, attribute: true },
      form: { attribute: false }
    };
  }

  constructor() {
    super();
    this._internals = this.attachInternals();
    this.state = {};
    this.showSubmit = true;
    this.confirmText = "Submit";
    this.name = this.getAttribute("name");
    this.form = {};
    this.formStateService = interpret(formStateMachine).start();
    this.formStateService.subscribe(state => {
      console.log(state.value, state.context);
      state.matches("initiated") && console.log("initiated");
    });
  }

  slotPopulated() {
    this.submitEvent = new Event("submit");
    /** @type {HTMLFormElement} */
    const shadowForm = this.shadowRoot.children[this.name];
    this.form = shadowForm;
    this.form.noValidate = false;
    let slots = [...this.shadowRoot.querySelectorAll("slot")];
    slots.forEach(slot => {
      let nodes = slot.assignedNodes();
      /**@type {Array<HTMLInputElement>} */
      // @ts-ignore
      let htmlInputs = nodes.filter(node => node.nodeName === "INPUT");
      htmlInputs.map(input => {
        this.state = {
          ...this.state,
          [input.name]: input
        };
        input.required = true;
        input.addEventListener("input", e => this.formValueUpdated(e, this));
        input.addEventListener("focus", () =>
          this.formStateService.send("FOCUS")
        );
        this.form.prepend(input);
      });
      this.formStateService.send("SLOTTED");
    });
  }
  /**
   * @return
   */
  render() {
    const { showSubmit, confirmText, name, state } = this;
    return html`
      ${popOverCss}
      <form
        @submit=${this.handleSubmit}
        .showSubmit=${showSubmit}
        .confirmText="${confirmText}"
        .name=${name}
      >
        <slot name="input" @slotchange=${this.slotPopulated}></slot>
        ${showSubmit &&
          html`
            <button
              @click=${() => this.form.dispatchEvent(this.submitEvent)}
              type="submit"
            >
              ${confirmText}
            </button>
          `}
      </form>
    `;
  }
  /** @param {Event} e * @param {Tofes} objRoot */
  formValueUpdated(e, objRoot) {
    /** @type {HTMLInputElement} */
    // @ts-ignore
    const { name } = e.target;
    popFactory(e.target);

    // objRoot.toggleService.send("TOGGLE");
  }
  /** @param {Event} e */
  handleSubmit(e) {
    // if (!e.target.checkValidity()) {
    console.log(e.target);
    e.preventDefault();
    for (let input in this.state) {
      if (this.state[input].validity.valid);
    }

    // }
    // e.target.reportValidity();
  }
}

customElements.define("tohen-tofes", Tofes);
const popOverCss = html`
  <style>
    .tippy-tooltip[data-animation="fade"][data-state="hidden"] {
      opacity: 0;
    }
    .tippy-iOS {
      cursor: pointer !important;
      -webkit-tap-highlight-color: transparent;
    }
    .tippy-popper {
      pointer-events: none;
      max-width: calc(100vw - 10px);
      transition-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1);
      transition-property: transform;
    }
    .tippy-tooltip {
      position: relative;
      color: #fff;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.4;
      background-color: #333;
      transition-property: visibility, opacity, transform;
      outline: 0;
    }
    .tippy-tooltip[data-placement^="top"] > .tippy-arrow {
      border-width: 8px 8px 0;
      border-top-color: #333;
      margin: 0 3px;
      transform-origin: 50% 0;
      bottom: -7px;
    }
    .tippy-tooltip[data-placement^="bottom"] > .tippy-arrow {
      border-width: 0 8px 8px;
      border-bottom-color: #333;
      margin: 0 3px;
      transform-origin: 50% 7px;
      top: -7px;
    }
    .tippy-tooltip[data-placement^="left"] > .tippy-arrow {
      border-width: 8px 0 8px 8px;
      border-left-color: #333;
      margin: 3px 0;
      transform-origin: 0 50%;
      right: -7px;
    }
    .tippy-tooltip[data-placement^="right"] > .tippy-arrow {
      border-width: 8px 8px 8px 0;
      border-right-color: #333;
      margin: 3px 0;
      transform-origin: 7px 50%;
      left: -7px;
    }
    .tippy-tooltip[data-interactive][data-state="visible"] {
      pointer-events: auto;
    }
    .tippy-tooltip[data-inertia][data-state="visible"] {
      transition-timing-function: cubic-bezier(0.54, 1.5, 0.38, 1.11);
    }
    .tippy-arrow {
      position: absolute;
      border-color: transparent;
      border-style: solid;
    }
    .tippy-content {
      padding: 5px 9px;
    }
  </style>
`;
