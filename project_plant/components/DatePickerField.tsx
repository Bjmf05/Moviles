import { BlurView } from "expo-blur";
import { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  error?: string;
  placeholder?: string;
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

const weekDays = ["D", "L", "M", "M", "J", "V", "S"];

const years = Array.from({ length: 151 }, (_, i) => 2026 - i);

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthStartOffset(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getDisplayDate(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return formatDate(parsed);
}

export function DatePickerField({
  label,
  value,
  onChange,
  error,
  placeholder = "Selecciona una fecha",
}: DatePickerFieldProps) {
  const [showModal, setShowModal] = useState(false);
  const [tempYear, setTempYear] = useState(2000);
  const [tempMonth, setTempMonth] = useState(0);
  const [tempDay, setTempDay] = useState(1);

  const handleOpen = () => {
    const baseDate = value ? new Date(value) : new Date(2000, 0, 1);
    const safeDate = Number.isNaN(baseDate.getTime())
      ? new Date(2000, 0, 1)
      : baseDate;
    setTempYear(safeDate.getFullYear());
    setTempMonth(safeDate.getMonth());
    setTempDay(safeDate.getDate());
    setShowModal(true);
  };

  const handleConfirm = () => {
    const newDate = new Date(tempYear, tempMonth, tempDay);
    onChange(newDate.toISOString());
    setShowModal(false);
  };

  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={handleOpen}>
        <Text style={styles.icon}>📅</Text>
        <Text style={value ? styles.text : styles.placeholder}>
          {value ? getDisplayDate(value) : placeholder}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        transparent
        animationType="fade"
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.backdrop}>
          <BlurView intensity={90} tint="light" style={styles.sheet}>
            <Text style={styles.modalTitle}>
              Selecciona tu fecha de nacimiento
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
                    color="#333"
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
                    color="#333"
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.calendarHeader}>
              {weekDays.map((day, index) => (
                <Text key={`${day}-${index}`} style={styles.calendarHeaderText}>
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
                const offset = getMonthStartOffset(tempYear, tempMonth);
                const dayNumber = index - offset + 1;
                if (dayNumber < 1) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
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

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={handleConfirm}
              >
                <Text style={[styles.btnText, styles.btnTextPrimary]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#52796f",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    fontSize: 15,
    color: "#1b4332",
  },
  placeholder: {
    fontSize: 15,
    color: "#aaa",
  },
  error: {
    fontSize: 12,
    color: "#e63946",
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 4,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "rgba(247, 255, 244, 0.95)",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b4332",
    marginBottom: 12,
    textAlign: "center",
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
    backgroundColor: "rgba(240, 247, 244, 0.8)",
  },
  dayCellSelected: {
    backgroundColor: "#2d6a4f",
  },
  dayText: {
    fontSize: 14,
    color: "#1b4332",
    fontWeight: "600",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "800",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "rgba(240, 247, 244, 0.9)",
  },
  btnPrimary: {
    backgroundColor: "#2d6a4f",
  },
  btnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2d6a4f",
  },
  btnTextPrimary: {
    color: "#fff",
  },
});
