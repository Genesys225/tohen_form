function changeToValidityState(event, ctx) {
	const { send } = ctx.inputStateService;
	const { source, validityReport } = event;
	if (ctx.currentValidity === "valid")
		send({
			type: "VALID",
			source
		});
	else
		send({
			type: "INVALID",
			source,
			validityReport
		});
}

export const actions = {
	validateInput(context, event) {
		const { customValidationFn, currentInput } = context;
		const isNativeValid = currentInput.checkValidity();
		const customValidity =
			customValidationFn && customValidationFn(currentInput);
		const isCustomValid =
			customValidity === null || !customValidity || customValidity.error;
		const { validity } = currentInput;
		if (isCustomValid && isNativeValid) return "valid";
		const source = isNativeValid ? "customValidation" : "nativeValidation";
		event.validityReport = {
			source,
			validity,
			customValidity
		};

		return "invalid";
	},

	reportValidityChange: {
		type: "reportValidityChange",
		exec({ formStateService, currentInput }, event) {
			formStateService.send({ ...event, currentInput });
		}
	},

	execValidationEffects: {
		type: "execValidationEffects",
		exec(context, event) {
			const { currentInput } = context;
			const { _tippy } = currentInput;
			switch (event.type) {
				case "VALID":
					currentInput.classList.add("valid");
					currentInput.classList.remove("invalid");
					_tippy.hide();
					break;
				case "INVALID":
					currentInput.classList.remove("valid");
					currentInput.classList.add("invalid");
					_tippy.show();
					break;

				default:
					_tippy.show();
					break;
			}
		}
	},

	changeToValidityState: {
		type: "changeToValidityState",
		exec(ctx, event) {
			const { type } = event;
			const isBlurred = type === "BLUR";
			const isValid = ctx.currentValidity === "valid";
			const delay = isValid || isBlurred ? 0 : ctx.invalidationDelay;
			setTimeout(changeToValidityState, delay, event, ctx);
		}
	}
};
