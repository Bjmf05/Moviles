import { useState } from "react";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatFab from "../../components/chat/ChatFab";
import ChatModal from "../../components/chat/ChatModal";

const Icon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.5 }}>
    {emoji}
  </Text>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [chatVisible, setChatVisible] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: "#d8f3dc",
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: "#2d6a4f",
          tabBarInactiveTintColor: "#aaa",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ focused }) => <Icon emoji="🏠" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explorar",
            tabBarIcon: ({ focused }) => <Icon emoji="🔍" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            title: "Cámara",
            tabBarIcon: ({ focused }) => <Icon emoji="📷" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="garden"
          options={{
            title: "Mi Jardín",
            tabBarIcon: ({ focused }) => <Icon emoji="🌱" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ focused }) => <Icon emoji="👤" focused={focused} />,
          }}
        />
      </Tabs>

      {!chatVisible && <ChatFab onPress={() => setChatVisible(true)} />}
      <ChatModal visible={chatVisible} onClose={() => setChatVisible(false)} />
    </View>
  );
}
