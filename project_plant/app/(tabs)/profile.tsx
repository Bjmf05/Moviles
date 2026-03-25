import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getUserProfile, logout, updateUserProfile } from "../../lib/auth";

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", birthdate: "", country: "" });

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    const data = await getUserProfile(user.uid);
    setProfile(data);
    setForm({
      name: data?.name ?? "",
      birthdate: data?.birthdate ?? "",
      country: data?.country ?? "",
    });
  };

  const handleSave = async () => {
    if (!user) return;
    await updateUserProfile(user.uid, form);
    setEditing(false);
    load();
  };

  const handlePhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!res.canceled && user) {
      await updateUserProfile(user.uid, { photoURL: res.assets[0].uri });
      load();
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>👤 Mi Perfil</Text>

      <TouchableOpacity onPress={handlePhoto} style={styles.avatarWrapper}>
        {profile?.photoURL ? (
          <Image source={{ uri: profile.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {profile?.name?.[0] ?? "?"}
            </Text>
          </View>
        )}
        <Text style={styles.changePhoto}>Cambiar foto</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        {editing ? (
          <>
            {[
              ["Nombre", "name"],
              ["Fecha de nacimiento", "birthdate"],
              ["País", "country"],
            ].map(([label, key]) => (
              <View key={key} style={{ marginBottom: 14 }}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={form[key as keyof typeof form]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Guardar cambios</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setEditing(false)}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <InfoField icon="👤" label="Nombre" value={profile?.name} />
            <InfoField icon="📧" label="Correo" value={user?.email ?? ""} />
            <InfoField
              icon="🎂"
              label="Fecha de nacimiento"
              value={profile?.birthdate}
            />
            <InfoField icon="🌍" label="País" value={profile?.country} />
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.editBtnText}>✏️ Editar perfil</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoField({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldIcon}>{icon}</Text>
      <View>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value ?? "—"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f4" },
  content: { padding: 24, paddingTop: 64, alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1b4332",
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  avatarWrapper: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#2d6a4f",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 36, color: "#fff", fontWeight: "800" },
  changePhoto: {
    color: "#52796f",
    fontSize: 13,
    marginTop: 8,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 16,
  },
  field: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 18,
  },
  fieldIcon: { fontSize: 22, marginTop: 2 },
  fieldLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: 15,
    color: "#1b4332",
    fontWeight: "600",
    marginTop: 2,
  },
  input: {
    backgroundColor: "#f0f7f4",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#d8f3dc",
  },
  editBtn: {
    backgroundColor: "#f0f7f4",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d8f3dc",
  },
  editBtnText: { color: "#2d6a4f", fontWeight: "700", fontSize: 15 },
  saveBtn: {
    backgroundColor: "#2d6a4f",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelBtn: { borderRadius: 14, padding: 14, alignItems: "center" },
  cancelBtnText: { color: "#52796f", fontWeight: "600" },
  logoutBtn: {
    backgroundColor: "#ffe5e5",
    borderRadius: 14,
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  logoutBtnText: { color: "#e63946", fontWeight: "700", fontSize: 15 },
});
