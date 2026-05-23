import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { forwardRef } from "react";
import {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

type InputTextProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  icon?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  returnKeyType?: ReturnKeyTypeOptions;
  autoComplete?: TextInputProps["autoComplete"];
  blurOnSubmit?: boolean;
  inputProps?: TextInputProps;
};

function InputTextWithRef<T extends FieldValues>(
  {
    control,
    name,
    label,
    placeholder,
    icon,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    returnKeyType,
    autoComplete,
    blurOnSubmit,
    inputProps,
  }: InputTextProps<T>,
  ref: React.Ref<TextInput>,
) {
  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { onChange, value, onBlur },
        fieldState: { error },
      }) => (
        <View style={styles.wrapper}>
          <Text style={styles.label}>{icon ? `${icon} ${label}` : label}</Text>
          <TextInput
            ref={ref}
            style={[styles.input, error && styles.inputError]}
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            placeholder={placeholder}
            placeholderTextColor="#aaa"
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            returnKeyType={returnKeyType}
            autoComplete={autoComplete}
            blurOnSubmit={blurOnSubmit}
            {...inputProps}
          />
          {error && <Text style={styles.error}>{error.message}</Text>}
        </View>
      )}
    />
  );
}

const InputText = forwardRef(InputTextWithRef) as <T extends FieldValues>(
  props: InputTextProps<T> & { ref?: React.Ref<TextInput> },
) => React.ReactElement;

export { InputText };
export default InputText;

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#52796f",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
    color: "#1b4332",
  },
  inputError: { borderColor: "#e63946" },
  error: { fontSize: 12, color: "#e63946", marginTop: 4, marginLeft: 4 },
});
