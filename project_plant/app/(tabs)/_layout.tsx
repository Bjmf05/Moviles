import { Tabs } from "expo-router";
import { Text } from "react-native";

const Icon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.5 }}>
    {emoji}
  </Text>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#d8f3dc",
          height: 60,
          paddingBottom: 8,
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
  );
}
