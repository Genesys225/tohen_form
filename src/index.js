import { LitElement, html, css } from "lit-element";
import { popFactory } from "./popOver";
import { createMachine, interpret, assign } from "@xstate/fsm";
import { popOverCss } from "./tippyStyles";
const actions = {
  syncContext(context, event) {
    const { validationConfig } = event;
    const validationProps = Object.keys(context);
    validationConfig
      .map(prop => [prop[0].split("_").join(""), prop[1]])
      .filter(prop => validationProps.includes(prop[0]))
      .forEach(prop => {
        context[prop[0]] = prop[1];
      });
  }, initiateInputMachine({ currentInput, state }) {
    const focusedInput = state[currentInput];
    const inputStateMachine = createInputMachine(focusedInput)
    focusedInput.inputStateService = interpret(inputStateMachine).start()
  },
  validateInput({ context: { currentInput } }) {
    const { custumValidationFn } = currentInput
    const isValid = currentInput.checkValidity()
    const isCustomValid = custumValidationFn(currentInput) || null
    const { inputStateService } = currentInput
    if ((isCustomValid === null || isCustomValid) && isValid) {
      inputStateService.send("VALID")
    } else inputStateService.send("INVALID")
  }
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
        INPUT: {
          target: "validating",
          actions: { type: actions.validateInput.name, exec: actions.syncContext }
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
        INPUT: "validatingF"
      }

    },
    valid: {

    }
  }
});

/** @typedef {import("../node_modules/@xstate/fsm/dist/types").EventObject } EventObject */
/** @typedef {import("../node_modules/@xstate/fsm/dist/types").StateMachine.Machine } formStateMachine */
const formStateMachine = createMachine({
  id: "formStateMachine",
  initial: "idle",
  context: {
    focused: false,
    currentInput: null,
    submitFailedValidation: false,
    disableValidation: false,
    tippyValidationPop: true,
    validateBeforeSubmit: false
  },
  states: {
    idle: {
      on: {
        SLOTTED: {
          target: "initiated",
          actions: [
            { type: actions.syncContext.name, exec: actions.syncContext }
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
            focused: (context, event) => {
              context.currentInput = event.currentInput;
              console.log("keep focusing", context, event);
              // actions.initiateInputMachine(event);
              return true;
            }
          })
        }
      }
    }
  }
});

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
      disableValidation: { type: Boolean },
      tippyValidationPop: { type: Boolean },
      validateBeforeSubmit: { type: Boolean },
      customValidationStyle: { type: Object },
      name: { type: String, reflect: true, attribute: true },
      form: { attribute: false }
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
    this.showSubmit = true;
    this.confirmText = "Submit";
    this.name = this.getAttribute("name");
    this.form = {};
    this.formStateService = interpret(formStateMachine).start();
    this.formStateService.subscribe(state => {
      console.log(state.value, state.context, state.changed);
      state.matches("inputFocused") && console.log("inputFocused");
    });
  }

  slotPopulated() {
    /** @type {HTMLFormElement} */
    const shadowForm = this.shadowRoot.children[this.name];
    this.form = shadowForm;
    this.form.noValidate = true;
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
        input.addEventListener("input", this.formValueUpdated);
        input.addEventListener("focus", this.handleFocus)
        this.form.prepend(input);
      });
      this.formStateService.send({
        type: "SLOTTED",
        validationConfig: Object.entries(this)
      });
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

  formValueUpdated(e) {
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


