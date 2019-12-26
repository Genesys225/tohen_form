import { LitElement, html, css } from "lit-element";
import { popFactory } from "./popOver";
import { createMachine, interpret, assign } from "@xstate/fsm";
import { popOverCss } from "./tippyStyles";

const actions = {
  initiateForm(_context, { tofes }) {
    const { shadowRoot, state, form, handleFocus, handleInput, handleBlur } = tofes
    const slots = [...shadowRoot.querySelectorAll("slot")];
    slots.forEach(slot => {
      const nodes = slot.assignedNodes();
      /**@type {Array<HTMLInputElement>} */
      const htmlInputs = nodes.filter(node => node.nodeName === "INPUT");
      htmlInputs.forEach(input => {
        tofes.state = {
          ...state,
          [input.name]: input
        };
        input.required = true;
        input.addEventListener("input", handleInput.bind(tofes));
        input.addEventListener("focus", handleFocus.bind(tofes));
        input.addEventListener("blur", handleBlur.bind(tofes));
        form.prepend(input);
      });
    });
  },

  initiateInput({ currentInput, state }) {
    const focusedInput = state[currentInput];
    const inputStateMachine = createInputMachine(focusedInput)
    focusedInput.inputStateService = interpret(inputStateMachine).start()
  },

  validateInput({ context: { currentInput } }) {
    const { custumValidationFn } = currentInput
    const isValid = currentInput.checkValidity()
    const isCustomValid = custumValidationFn(currentInput) || null
    const { inputStateService } = currentInput
    debugger
    if ((isCustomValid === null || isCustomValid) && isValid) {
      inputStateService.send("VALID")
    } else inputStateService.send("INVALID")
  }
}

const createFormMachine = tofes => {
  const {
    submitFailedValidation,
    disableValidation,
    tippyValidationPop,
    validateBeforeSubmit
  } = tofes;
  return createMachine({
    id: "formStateMachine",
    initial: "idle",
    context: {
      focused: false,
      currentInput: null,
      submitFailedValidation,
      disableValidation,
      tippyValidationPop,
      validateBeforeSubmit
    },
    states: {
      idle: {
        on: {
          // @ts-ignore
          SLOTTED: {
            target: "initiated",
            actions: [
              { type: actions.initiateForm.name, exec: actions.initiateForm }
            ]
          }
        }
      },
      initiated: { on: { FOCUS: "inputFocused" } },
      inputFocused: {
        on: {
          FOCUS: {
            target: "inputFocused",
            actions: assign({
              /** @param {Object} context * @param {EventObject} event */
              focused: (_context, event) => {
                // actions.initiateInput(event);
                return event.currentInput;
              }
            })
          }
        }
      }
    }
  })
}

const createInputMachine = focusedInput => createMachine({
  id: "inputStateMachine",
  initial: "focused",
  context: {
    currentInput: focusedInput,
    custumValidationFn: focusedInput.custumValidationFn
  },
  states: {
    focused: {
      on: {
        // @ts-ignore
        INPUT: {
          target: "validating",
          actions: { type: actions.validateInput.name, exec: actions.validateInput }
        }
      }
    },
    validating: {
      on: {
        VALID: "valid",
        INVALID: "invalid",
        INPUT: "validating"
      }
    },
    invalid: {
      on: {
        INPUT: "validating"
      }

    },
    valid: {

    }
  }
});

/** @typedef {import("../node_modules/@xstate/fsm/dist/types").EventObject } EventObject */
/** @typedef {import("../node_modules/@xstate/fsm/dist/types").StateMachine.Machine } formStateMachine */

/**
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
      disableValidation: { type: Boolean },
      tippyValidationPop: { type: Boolean },
      validateBeforeSubmit: { type: Boolean },
      customValidationStyle: { type: Object },
      name: { type: String, reflect: true, attribute: true },
      form: { type: Object }
    };
  }

  static setState(newState) {
    this.state = newState(this.state);
    return this.state;
  }

  constructor() {
    super();
    this.state = {};
    this.disableValidation = false;
    this.tippyValidationPop = true;
    this.validateBeforeSubmit = false;
    this.submitFailedValidation = false
    this.showSubmit = true;
    this.confirmText = "Submit";
    this.form;
    this.name = this.getAttribute("name");
    const formStateMachine = createFormMachine(this)
    this.formStateService = interpret(formStateMachine).start();
    this.formStateService.subscribe(state => {
      console.log(state.value, state.context, state.changed);
      state.matches("inputFocused") && console.log("inputFocused");
    });
  }

  slotPopulated() {
    /** @type {HTMLFormElement} */
    this.form = this.shadowRoot.children[this.name];

    this.formStateService.send({
      type: "SLOTTED",
      tofes: this
    });
  }

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
            <button type="submit">
              ${confirmText}
            </button>
          `}
      </form>
    `;
  }

  handleFocus(e) {
    this.formStateService.send({
      type: "FOCUS",
      currentInput: e.target.name,
      state: this.state
    })
  }

  handleBlur(e) {
    console.log(e)
  }

  handleInput(e) {
    popFactory(e.target);
  }

  /** @param {Event} e */
  handleSubmit(e) {
    console.log(e.target);
    e.stopImmediatePropagation();
    e.preventDefault();
  }

}

customElements.define("tohen-tofes", Tofes);


