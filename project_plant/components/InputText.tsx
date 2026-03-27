import { Control, Controller, FieldValues, Path } from "react-hook-form";
import {
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
  inputProps?: TextInputProps;
};

function InputText<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  icon,
  secureTextEntry,
  inputProps,
}: InputTextProps<T>) {
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
            style={[styles.input, error && styles.inputError]}
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            placeholder={placeholder}
            placeholderTextColor="#aaa"
            secureTextEntry={secureTextEntry}
            {...inputProps}
          />
          {error && <Text style={styles.error}>{error.message}</Text>}
        </View>
      )}
    />
  );
}

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
