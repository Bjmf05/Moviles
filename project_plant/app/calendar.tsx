import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CalendarGrid, assignPlantColors } from "../components/CalendarGrid";
import { Toast } from "../components/Toast";
import { useCalendar } from "../hooks/useCalendar";
import { requestNotificationPermission } from "../lib/notifications";

export default function CalendarScreen() {
  const router = useRouter();
  const {
    waterings,
    plants,
    month,
    year,
    loadMonth,
    goToPrevMonth,
    goToNextMonth,
    markAsWatered,
    editSchedule,
    getWateringsForDay,
  } = useCalendar();

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editingPlant, setEditingPlant] = useState<{ id: string; name: string; freq: number } | null>(null);
  const [editFreq, setEditFreq] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" as "success" | "error" });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ visible: true, message, type });
  };

  const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  useFocusEffect(
    useCallback(() => {
      loadMonth(month, year);
    }, [month, year, loadMonth]),
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
    requestNotificationPermission();
  }, [fadeAnim, slideAnim]);

  const handleDayPress = (day: number) => {
    setSelectedDay(day === selectedDay ? null : day);
  };

  const handleMarkWatered = async (plantId: string) => {
    try {
      await markAsWatered(plantId);
      showToast("💧 Riego registrado");
    } catch {
      showToast("Error al registrar riego", "error");
    }
  };

  const handleEditSchedule = async () => {
    if (!editingPlant) return;
    const freq = parseInt(editFreq, 10);
    if (isNaN(freq) || freq < 1) {
      showToast("Frecuencia inválida", "error");
      return;
    }
    try {
      await editSchedule(editingPlant.id, { frequencyDays: freq });
      showToast("Calendario actualizado");
      setEditingPlant(null);
    } catch {
      showToast("Error al actualizar", "error");
    }
  };

  const plantColorMap = assignPlantColors(plants);

  const dayWaterings: Record<number, { plantId: string; nombreComun: string; completed: boolean }[]> = {};
  waterings.forEach((w) => {
    const day = parseInt(w.date.split("-")[2], 10);
    if (!dayWaterings[day]) dayWaterings[day] = [];
    dayWaterings[day].push({ plantId: w.plantId, nombreComun: w.nombreComun, completed: w.completed });
  });

  const selectedWaterings = selectedDay ? getWateringsForDay(selectedDay) : [];
  const pendingCount = waterings.filter((w) => !w.completed).length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#f0f7f4", "#e8f5e9", "#f0f7f4"]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backBtn}>← Volver</Text>
          </Pressable>
          <Text style={styles.title}>Calendario de riego</Text>
          <Text style={styles.subtitle}>
            {pendingCount > 0 ? `${pendingCount} riego${pendingCount !== 1 ? "s" : ""} pendiente${pendingCount !== 1 ? "s" : ""}` : "Al día"}
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.monthNav}>
            <Pressable onPress={goToPrevMonth} style={styles.navBtn}>
              <Text style={styles.navBtnText}>‹</Text>
            </Pressable>
            <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
            <Pressable onPress={goToNextMonth} style={styles.navBtn}>
              <Text style={styles.navBtnText}>›</Text>
            </Pressable>
          </View>

          <CalendarGrid
            year={year}
            month={month}
            dayWaterings={dayWaterings}
            onDayPress={handleDayPress}
            plantColorMap={plantColorMap}
          />
        </Animated.View>

        {plants.length > 0 && (
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Tus plantas</Text>
            <View style={styles.legendRow}>
              {plants.map((plant) => (
                <View key={plant.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: plantColorMap[plant.id] || "#74c69d" }]} />
                  <Text style={styles.legendText} numberOfLines={1}>{plant.nombreComun}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {selectedDay && selectedWaterings.length > 0 && (
          <Animated.View style={styles.dayDetail}>
            <Text style={styles.dayDetailTitle}>
              {selectedDay} de {MONTHS[month]}
            </Text>
            {selectedWaterings.map((w) => (
              <View key={w.plantId} style={styles.wateringRow}>
                <View style={[styles.wateringDot, { backgroundColor: plantColorMap[w.plantId] || "#74c69d", opacity: w.completed ? 0.4 : 1 }]} />
                <View style={styles.wateringInfo}>
                  <Text style={[styles.wateringName, w.completed && styles.wateringDone]}>{w.nombreComun}</Text>
                  <Text style={styles.wateringStatus}>{w.completed ? "✓ Regada" : " Pendiente"}</Text>
                </View>
                {!w.completed && (
                  <Pressable style={styles.waterBtn} onPress={() => handleMarkWatered(w.plantId)}>
                    <Text style={styles.waterBtnText}>💧</Text>
                  </Pressable>
                )}
                <Pressable style={styles.editBtnSmall} onPress={() => {
                  setEditingPlant({ id: w.plantId, name: w.nombreComun, freq: 3 });
                  setEditFreq("3");
                }}>
                  <Text style={styles.editBtnSmallText}>✏️</Text>
                </Pressable>
              </View>
            ))}
          </Animated.View>
        )}

        {selectedDay && selectedWaterings.length === 0 && (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayText}>No hay riegos este día</Text>
          </View>
        )}
      </ScrollView>

      <Modal transparent animationType="fade" visible={!!editingPlant} onRequestClose={() => setEditingPlant(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar frecuencia</Text>
            <Text style={styles.modalSubtitle}>{editingPlant?.name}</Text>
            <Text style={styles.modalLabel}>Frecuencia (días entre riegos)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={editFreq}
              onChangeText={setEditFreq}
              placeholder="Ej. 3"
              placeholderTextColor="#aaa"
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setEditingPlant(null)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.modalConfirm} onPress={handleEditSchedule}>
                <Text style={styles.modalConfirmText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onClose={() => setToast((t) => ({ ...t, visible: false }))} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f4" },
  decorCircle1: { position: "absolute", top: -50, right: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(45, 106, 79, 0.06)" },
  decorCircle2: { position: "absolute", bottom: 150, left: -60, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(116, 198, 157, 0.08)" },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 20 },
  backBtn: { fontSize: 15, color: "#52796f", fontWeight: "600", marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", color: "#1b4332", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: "#74c69d", marginTop: 4, fontWeight: "600" },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  navBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  navBtnText: { fontSize: 24, color: "#2d6a4f", fontWeight: "700" },
  monthTitle: { fontSize: 18, fontWeight: "700", color: "#1b4332" },
  legend: { marginTop: 16, backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  legendTitle: { fontSize: 13, fontWeight: "700", color: "#52796f", textTransform: "uppercase", marginBottom: 10 },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, color: "#1b4332", maxWidth: 120 },
  dayDetail: { marginTop: 16, backgroundColor: "#fff", borderRadius: 20, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  dayDetailTitle: { fontSize: 16, fontWeight: "700", color: "#1b4332", marginBottom: 12 },
  wateringRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f7f4", gap: 10 },
  wateringDot: { width: 12, height: 12, borderRadius: 6 },
  wateringInfo: { flex: 1 },
  wateringName: { fontSize: 15, fontWeight: "600", color: "#1b4332" },
  wateringDone: { textDecorationLine: "line-through", color: "#aaa" },
  wateringStatus: { fontSize: 12, color: "#74c69d", marginTop: 2 },
  waterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#d8f3dc", alignItems: "center", justifyContent: "center" },
  waterBtnText: { fontSize: 20 },
  editBtnSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0f7f4", alignItems: "center", justifyContent: "center" },
  editBtnSmallText: { fontSize: 16 },
  emptyDay: { marginTop: 16, alignItems: "center", padding: 24 },
  emptyDayText: { fontSize: 14, color: "#aaa" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: "#fff", borderRadius: 22, padding: 24, shadowColor: "#1b4332", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 6 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1b4332", marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: "#52796f", marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: "700", color: "#52796f", textTransform: "uppercase", marginBottom: 8 },
  modalInput: { backgroundColor: "#f0f7f4", borderRadius: 14, padding: 14, fontSize: 16, borderWidth: 1.5, borderColor: "#d8f3dc", color: "#1b4332", marginBottom: 20 },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: "#f0f7f4", alignItems: "center" },
  modalCancelText: { color: "#52796f", fontWeight: "700" },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: "#2d6a4f", alignItems: "center" },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
});
