import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import InputText from "../../components/InputText";
import Toast from "../../components/Toast";
import { register } from "../../lib/auth";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirm: string;
  birthdate: string;
  country: string;
};

const registerSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio."),
    email: z.string().email("El correo no tiene un formato valido."),
    password: z
      .string()
      .min(6, "La contrasena debe tener al menos 6 caracteres."),
    confirm: z.string().min(1, "Confirma tu contrasena."),
    birthdate: z
      .string()
      .min(1, "Selecciona tu fecha de nacimiento.")
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "La fecha no es valida.",
      ),
    country: z.string().min(1, "El pais es obligatorio."),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Las contrasenas no coinciden.",
  });

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tempYear, setTempYear] = useState(2000);
  const [tempMonth, setTempMonth] = useState(0);
  const [tempDay, setTempDay] = useState(1);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({
    visible: false,
    message: "",
    type: "success",
  });
  const { control, handleSubmit } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm: "",
      birthdate: "",
      country: "",
    },
  });

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const getMonthStartOffset = (year: number, month: number) => {
    const dayOfWeek = new Date(year, month, 1).getDay();
    return dayOfWeek;
  };

  const monthLabels = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const years = Array.from({ length: 151 }, (_, i) => 2025 - i);
  const weekDays = ["D", "L", "M", "M", "J", "V", "S"];

  const getDisplayDate = (value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return formatDate(parsed);
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success",
  ) => {
    setToast({ visible: true, message, type });
  };

  const getRegisterErrorMessage = (error: any) => {
    const code = error?.code as string | undefined;
    switch (code) {
      case "auth/email-already-in-use":
        return "Ese correo ya esta registrado. Prueba iniciar sesion.";
      case "auth/invalid-email":
        return "El correo no tiene un formato valido.";
      case "auth/weak-password":
        return "La contrasena es muy debil. Usa al menos 6 caracteres.";
      case "auth/network-request-failed":
        return "Sin conexion. Revisa tu internet e intenta de nuevo.";
      default:
        return "No se pudo crear la cuenta. Intenta de nuevo.";
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    const { name, email, password, confirm, birthdate, country } = data;
    setLoading(true);
    try {
      await register(email, password, name, birthdate, country);
      showToast("Cuenta creada correctamente.");
      router.replace("../(tabs)/");
    } catch (e: any) {
      showToast(getRegisterErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 28, paddingTop: 60 }}
      >
        <Text style={styles.logo}>🌿 PlantID</Text>
        <Text style={styles.title}>Crear cuenta</Text>

        <InputText
          control={control}
          name="name"
          label="Nombre completo"
          icon="👤"
          placeholder="Tu nombre"
        />
        <InputText
          control={control}
          name="email"
          label="Correo electrónico"
          icon="✉️"
          placeholder="correo@ejemplo.com"
          inputProps={{
            keyboardType: "email-address",
            autoCapitalize: "none",
          }}
        />
        <InputText
          control={control}
          name="password"
          label="Contraseña"
          icon="🔒"
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
        />
        <InputText
          control={control}
          name="confirm"
          label="Confirmar contraseña"
          icon="🔒"
          placeholder="Repite la contraseña"
          secureTextEntry
        />
        <Controller
          control={control}
          name="birthdate"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <Text style={styles.dateLabel}>🎂 Fecha de nacimiento</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => {
                  const baseDate = value
                    ? new Date(value)
                    : new Date(2000, 0, 1);
                  const safeDate = Number.isNaN(baseDate.getTime())
                    ? new Date(2000, 0, 1)
                    : baseDate;
                  setTempYear(safeDate.getFullYear());
                  setTempMonth(safeDate.getMonth());
                  setTempDay(safeDate.getDate());
                  setShowDatePicker(true);
                }}
              >
                <Text style={value ? styles.dateText : styles.datePlaceholder}>
                  {value ? getDisplayDate(value) : "Selecciona una fecha"}
                </Text>
              </TouchableOpacity>
              {error?.message ? (
                <Text style={styles.dateError}>{error.message}</Text>
              ) : null}
              {showDatePicker && (
                <Modal
                  transparent
                  animationType="fade"
                  visible={showDatePicker}
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={styles.modalBackdrop}>
                    <View style={styles.modalSheet}>
                      <Text style={styles.modalTitle}>
                        Selecciona una fecha
                      </Text>
                      <View style={styles.pickerRow}>
                        <Picker
                          style={styles.picker}
                          selectedValue={tempMonth}
                          onValueChange={(nextMonth) => {
                            const maxDay = getDaysInMonth(tempYear, nextMonth);
                            setTempMonth(nextMonth);
                            setTempDay((current) =>
                              current > maxDay ? maxDay : current,
                            );
                          }}
                        >
                          {monthLabels.map((label, index) => (
                            <Picker.Item
                              key={label}
                              label={label}
                              value={index}
                            />
                          ))}
                        </Picker>
                        <Picker
                          style={styles.picker}
                          selectedValue={tempYear}
                          onValueChange={(nextYear) => {
                            const maxDay = getDaysInMonth(nextYear, tempMonth);
                            setTempYear(nextYear);
                            setTempDay((current) =>
                              current > maxDay ? maxDay : current,
                            );
                          }}
                        >
                          {years.map((year) => (
                            <Picker.Item
                              key={year}
                              label={`${year}`}
                              value={year}
                            />
                          ))}
                        </Picker>
                      </View>
                      <View style={styles.calendarHeader}>
                        {weekDays.map((day, index) => (
                          <Text
                            key={`${day}-${index}`}
                            style={styles.calendarHeaderText}
                          >
                            {day}
                          </Text>
                        ))}
                      </View>
                      <View style={styles.calendarGrid}>
                        {Array.from({
                          length:
                            getMonthStartOffset(tempYear, tempMonth) +
                            getDaysInMonth(tempYear, tempMonth),
                        }).map((_, index) => {
                          const offset = getMonthStartOffset(
                            tempYear,
                            tempMonth,
                          );
                          const dayNumber = index - offset + 1;
                          if (dayNumber < 1) {
                            return (
                              <View
                                key={`empty-${index}`}
                                style={styles.dayCell}
                              />
                            );
                          }

                          const isSelected = dayNumber === tempDay;

                          return (
                            <TouchableOpacity
                              key={dayNumber}
                              style={[
                                styles.dayCell,
                                isSelected && styles.dayCellSelected,
                              ]}
                              onPress={() => setTempDay(dayNumber)}
                            >
                              <Text
                                style={[
                                  styles.dayText,
                                  isSelected && styles.dayTextSelected,
                                ]}
                              >
                                {dayNumber}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={styles.modalBtn}
                          onPress={() => setShowDatePicker(false)}
                        >
                          <Text style={styles.modalBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.modalBtn, styles.modalBtnPrimary]}
                          onPress={() => {
                            const newDate = new Date(
                              tempYear,
                              tempMonth,
                              tempDay,
                            );
                            setSelectedDate(newDate);
                            onChange(newDate.toISOString());
                            setShowDatePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.modalBtnText,
                              styles.modalBtnTextPrimary,
                            ]}
                          >
                            OK
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              )}
            </>
          )}
        />
        <InputText
          control={control}
          name="country"
          label="País"
          icon="🌎"
          placeholder="Ej. Costa Rica"
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={handleSubmit(handleRegister)}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Creando cuenta..." : "Registrarse"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>
            ¿Ya tienes cuenta?{" "}
            <Text style={styles.linkBold}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f4" },
  logo: { fontSize: 36, textAlign: "center", marginBottom: 4 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b4332",
    textAlign: "center",
    marginBottom: 28,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#52796f",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  dateInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
    marginBottom: 16,
  },
  dateText: { fontSize: 15, color: "#1b4332" },
  datePlaceholder: { fontSize: 15, color: "#aaa" },
  dateError: {
    fontSize: 12,
    color: "#e63946",
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#f7fff4",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "#d8f3dc",
  },
  pickerRow: {
    flexDirection: "row",
    gap: 8,
  },
  picker: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 6,
  },
  calendarHeaderText: {
    width: "14.285%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#40916c",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  dayCell: {
    width: "14.285%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "#f0f7f4",
  },
  dayCellSelected: {
    backgroundColor: "#d8f3dc",
    borderWidth: 1,
    borderColor: "#2d6a4f",
  },
  dayText: {
    fontSize: 14,
    color: "#1b4332",
    fontWeight: "600",
  },
  dayTextSelected: {
    color: "#2d6a4f",
    fontWeight: "800",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b4332",
    marginBottom: 8,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#f0f7f4",
  },
  modalBtnPrimary: {
    backgroundColor: "#2d6a4f",
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2d6a4f",
  },
  modalBtnTextPrimary: {
    color: "#fff",
  },
  btn: {
    backgroundColor: "#2d6a4f",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { textAlign: "center", color: "#52796f", fontSize: 14 },
  linkBold: { fontWeight: "700", color: "#2d6a4f" },
});
