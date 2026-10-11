import type {
  AllSettings,
  NumberFieldName,
  SelectFieldName,
  SettingsScope,
  ToggleFieldName,
} from "./schema";

/**
 * Shapes of the field texts. The texts themselves are part of the
 * dictionaries in src/lib/i18n; these types make sure each language names
 * every field and every option.
 */
export interface FieldText {
  label: string;
  unit?: string;
  hint?: string;
}

export type ScopeLabels = Record<SettingsScope, string>;

export type NumberTexts = {
  [S in SettingsScope]: Record<NumberFieldName<S>, FieldText>;
};

export type ToggleTexts = {
  [S in SettingsScope]: Record<ToggleFieldName<S>, FieldText>;
};

type OptionLabels<S extends SettingsScope, K extends SelectFieldName<S>> = Record<
  AllSettings[S][K] & string,
  string
>;

export type SelectTexts = {
  [S in SettingsScope]: {
    [K in SelectFieldName<S>]: FieldText & { options: OptionLabels<S, K> };
  };
};

/** Why a profile action was refused; texts are in the dictionaries. */
export type ProfileError =
  | "signedOut"
  | "nameLength"
  | "tooMany"
  | "duplicateName"
  | "notFound"
  | "lastProfile"
  | "failed";
