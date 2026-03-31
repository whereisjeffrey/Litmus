import type {
  FormFieldInfo,
  FormInfo,
  FormResult,
  Finding,
} from "@placeholder/shared";

/**
 * Maps common input names/types to their expected autocomplete token.
 */
const AUTOCOMPLETE_MAP: Record<string, string> = {
  email: "email",
  name: "name",
  "first-name": "given-name",
  "given-name": "given-name",
  firstname: "given-name",
  "last-name": "family-name",
  "family-name": "family-name",
  lastname: "family-name",
  phone: "tel",
  tel: "tel",
  telephone: "tel",
  address: "street-address",
  "street-address": "street-address",
  city: "address-level2",
  state: "address-level1",
  zip: "postal-code",
  "postal-code": "postal-code",
  zipcode: "postal-code",
  country: "country-name",
  cc: "cc-number",
  "cc-number": "cc-number",
  "card-number": "cc-number",
  password: "current-password",
  username: "username",
};

function getSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const name = el.getAttribute("name");
  if (name) return `${el.tagName.toLowerCase()}[name="${name}"]`;
  return el.tagName.toLowerCase();
}

/**
 * Checks whether a required field has a visible indicator (asterisk, "required" text, etc.)
 */
function hasVisibleRequiredIndicator(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): boolean {
  // Check the associated label for an asterisk or "required" text
  const id = input.id;
  let labelText = "";

  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label) labelText = label.textContent || "";
  }
  const wrappingLabel = input.closest("label");
  if (wrappingLabel) labelText += wrappingLabel.textContent || "";

  // Check for asterisk or "(required)" text
  if (/\*|required/i.test(labelText)) return true;

  // Check for aria-required visual indicator (some frameworks add visual cues)
  const parent = input.parentElement;
  if (parent) {
    const siblingText = parent.textContent || "";
    if (/\*/.test(siblingText)) return true;
  }

  return false;
}

/**
 * Detects whether a password field has a visible toggle button nearby.
 */
function hasPasswordToggle(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): boolean {
  if (!(input instanceof HTMLInputElement) || input.type !== "password") {
    return false;
  }

  const parent = input.parentElement;
  if (!parent) return false;

  // Look for toggle button patterns in the parent container
  const toggleCandidates = parent.querySelectorAll(
    'button, [role="button"], [type="button"], .toggle-password, .show-password, .password-toggle, [aria-label*="password"], [aria-label*="show"], [aria-label*="visibility"]'
  );

  return toggleCandidates.length > 0;
}

function analyzeField(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): FormFieldInfo {
  const id = input.id;
  const name = input.getAttribute("name") || "";
  const type =
    input instanceof HTMLSelectElement
      ? "select"
      : input instanceof HTMLTextAreaElement
        ? "textarea"
        : input.type || "text";

  // Check for associated label via for/id, aria-labelledby, or wrapping label
  let hasLabel = false;
  if (id) {
    hasLabel = !!document.querySelector(`label[for="${CSS.escape(id)}"]`);
  }
  if (!hasLabel) {
    // Check aria-labelledby
    const labelledBy = input.getAttribute("aria-labelledby");
    if (labelledBy) {
      const labelEl = document.getElementById(labelledBy);
      hasLabel = !!labelEl;
    }
  }
  if (!hasLabel) {
    hasLabel = !!input.closest("label");
  }

  const hasAriaLabel = !!input.getAttribute("aria-label");
  const hasAriaDescribedBy = !!input.getAttribute("aria-describedby");
  const hasPlaceholder = !!input.getAttribute("placeholder");
  const autocompleteAttr = input.getAttribute("autocomplete") || "";
  const hasAutocomplete = autocompleteAttr !== "" && autocompleteAttr !== "off";
  const isRequired =
    input.hasAttribute("required") || input.getAttribute("aria-required") === "true";

  return {
    type,
    name,
    id,
    selector: getSelector(input),
    hasLabel,
    hasPlaceholder,
    hasAutocomplete,
    autocompleteValue: autocompleteAttr,
    isRequired,
    hasAriaLabel,
    hasAriaDescribedBy,
    hasVisibleRequiredIndicator: isRequired ? hasVisibleRequiredIndicator(input) : false,
    hasPasswordToggle: type === "password" ? hasPasswordToggle(input) : false,
  };
}

export function analyzeForms(): FormResult {
  const forms = document.querySelectorAll("form");
  const findings: Finding[] = [];
  const formInfos: FormInfo[] = [];
  const allFormFieldElements = new Set<Element>();

  forms.forEach((form, fi) => {
    const inputs = form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >("input, textarea, select");
    const fields: FormFieldInfo[] = [];

    inputs.forEach((input) => {
      // Skip hidden and submit inputs for labeling checks
      if (
        input instanceof HTMLInputElement &&
        (input.type === "hidden" || input.type === "submit" || input.type === "button")
      ) {
        allFormFieldElements.add(input);
        return;
      }

      allFormFieldElements.add(input);
      const field = analyzeField(input);
      fields.push(field);

      // Missing label
      if (!field.hasLabel && !field.hasAriaLabel && !field.hasAriaDescribedBy) {
        findings.push({
          id: `form-${fi}-nolabel-${field.name || field.id || fields.length}`,
          scanner: "form-analyzer",
          severity: "critical",
          title: "No field label",
          description: `A ${field.type} input (name="${field.name}") has no <label>, aria-label, or aria-describedby. Screen readers cannot identify this field.`,
          selector: field.selector,
          standard: "WCAG 1.3.1",
        });
      }

      // Missing autocomplete on common fields
      if (!field.hasAutocomplete) {
        const nameKey = (field.name || field.id).toLowerCase().replace(/[_-]/g, "-");
        if (AUTOCOMPLETE_MAP[nameKey]) {
          findings.push({
            id: `form-${fi}-autocomplete-${field.name || field.id}`,
            scanner: "form-analyzer",
            severity: "warning",
            title: "No autocomplete",
            description: `The "${field.name || field.id}" field should have autocomplete="${AUTOCOMPLETE_MAP[nameKey]}" to help browsers auto-fill.`,
            selector: field.selector,
            standard: "WCAG 1.3.5",
          });
        }
      }

      // Password field without visible toggle
      if (field.type === "password" && !field.hasPasswordToggle) {
        findings.push({
          id: `form-${fi}-password-notoggle-${field.name || field.id}`,
          scanner: "form-analyzer",
          severity: "info",
          title: "No password toggle",
          description:
            "Consider adding a show/hide password toggle button for better usability, especially on mobile devices.",
          selector: field.selector,
          standard: null,
        });
      }

      // Required field without visible indicator
      if (field.isRequired && !field.hasVisibleRequiredIndicator) {
        findings.push({
          id: `form-${fi}-required-noindicator-${field.name || field.id}`,
          scanner: "form-analyzer",
          severity: "warning",
          title: "No required indicator",
          description: `The "${field.name || field.id}" field is required but has no visible asterisk or "required" text. Users may not realize this field is mandatory.`,
          selector: field.selector,
          standard: "WCAG 3.3.2",
        });
      }

      // Password field without associated username
      if (field.type === "password") {
        const hasUsernameField = fields.some(
          (f) =>
            f.type === "email" ||
            f.type === "text" ||
            f.name.toLowerCase().includes("user") ||
            f.name.toLowerCase().includes("email")
        );
        if (!hasUsernameField) {
          findings.push({
            id: `form-${fi}-password-nousername`,
            scanner: "form-analyzer",
            severity: "info",
            title: "No username field",
            description:
              "Password managers work best when there is a visible username or email field in the same form.",
            selector: field.selector,
            standard: null,
          });
        }
      }
    });

    // Check for submit button
    const hasSubmitButton = !!(
      form.querySelector('button[type="submit"]') ||
      form.querySelector('input[type="submit"]') ||
      form.querySelector("button:not([type])") // default type is submit
    );

    if (!hasSubmitButton) {
      findings.push({
        id: `form-${fi}-nosubmit`,
        scanner: "form-analyzer",
        severity: "warning",
        title: "No submit button",
        description:
          "Forms should have an explicit submit button. Enter-key submission alone is not always discoverable.",
        selector: getSelector(form),
        standard: null,
      });
    }

    // Check for fieldset/legend on related radio/checkbox groups
    const hasFieldset = !!form.querySelector("fieldset");
    const radioGroups = new Set<string>();
    const checkboxGroups = new Set<string>();

    fields.forEach((f) => {
      if (f.type === "radio" && f.name) radioGroups.add(f.name);
      if (f.type === "checkbox" && f.name) checkboxGroups.add(f.name);
    });

    // Flag radio groups without fieldset/legend
    if ((radioGroups.size > 0 || checkboxGroups.size > 0) && !hasFieldset) {
      const groupNames = [...radioGroups, ...checkboxGroups].join(", ");
      findings.push({
        id: `form-${fi}-no-fieldset`,
        scanner: "form-analyzer",
        severity: "warning",
        title: "Fields not grouped",
        description: `Radio/checkbox group(s) "${groupNames}" should be wrapped in a <fieldset> with a <legend> so screen readers can associate the group label.`,
        selector: getSelector(form),
        standard: "WCAG 1.3.1",
      });
    }

    formInfos.push({
      action: form.getAttribute("action") || "",
      method: (form.getAttribute("method") || "get").toUpperCase(),
      selector: getSelector(form),
      fields,
      fieldCount: fields.length,
      hasSubmitButton,
      hasFieldset,
    });
  });

  // Check for orphaned fields (inputs not inside any <form>)
  const allInputs = document.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >("input, textarea, select");

  const orphanedFields: FormFieldInfo[] = [];
  allInputs.forEach((input) => {
    if (allFormFieldElements.has(input)) return;
    if (
      input instanceof HTMLInputElement &&
      (input.type === "hidden" || input.type === "submit" || input.type === "button")
    ) {
      return;
    }
    // Skip search inputs in nav bars — these are commonly orphaned intentionally
    if (input instanceof HTMLInputElement && input.type === "search") return;

    const field = analyzeField(input);
    orphanedFields.push(field);

    if (!field.hasLabel && !field.hasAriaLabel) {
      findings.push({
        id: `orphan-nolabel-${field.name || field.id || orphanedFields.length}`,
        scanner: "form-analyzer",
        severity: "critical",
        title: "No field label",
        description: `An input (type="${field.type}", name="${field.name}") exists outside any <form> and has no label.`,
        selector: field.selector,
        standard: "WCAG 1.3.1",
      });
    }
  });

  return { forms: formInfos, orphanedFields, findings };
}
