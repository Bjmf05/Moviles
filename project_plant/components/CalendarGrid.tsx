import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const WEEKDAYS = ["D", "L", "M", "M", "J", "V", "S"];

const PLANT_COLORS = [
  "#2d6a4f", "#e63946", "#3a86ff", "#f4a261",
  "#7b2cbf", "#e9c46a", "#6a994e", "#e5989b",
  "#52b788", "#d62828", "#4cc9f0", "#fb8500",
];

export interface CalendarDayWatering {
  plantId: string;
  nombreComun: string;
  completed: boolean;
}

interface CalendarGridProps {
  year: number;
  month: number;
  dayWaterings: Record<number, CalendarDayWatering[]>;
  onDayPress: (day: number) => void;
  plantColorMap: Record<string, string>;
}

function getMonthInfo(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

export function CalendarGrid({ year, month, dayWaterings, onDayPress, plantColorMap }: CalendarGridProps) {
  const { firstDay, daysInMonth } = useMemo(() => getMonthInfo(year, month), [year, month]);

  const rows: React.ReactNode[] = [];
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const todayDate = today.getDate();

  for (let row = 0; row < Math.ceil((firstDay + daysInMonth) / 7); row++) {
    const cells: React.ReactNode[] = [];
    for (let col = 0; col < 7; col++) {
      const dayNum = row * 7 + col - firstDay + 1;
      if (dayNum < 1 || dayNum > daysInMonth) {
        cells.push(<View key={`e-${row}-${col}`} style={styles.dayCell} />);
      } else {
        const waterings = dayWaterings[dayNum] || [];
        const isToday = isCurrentMonth && dayNum === todayDate;
        const allCompleted = waterings.length > 0 && waterings.every((w) => w.completed);

        cells.push(
          <Pressable key={dayNum} style={[styles.dayCell, isToday && styles.todayCell]} onPress={() => onDayPress(dayNum)}>
            <Text style={[styles.dayText, isToday && styles.todayText]}>{dayNum}</Text>
            {waterings.length > 0 && (
              <View style={styles.dotsRow}>
                {waterings.slice(0, 3).map((w) => (
                  <View
                    key={w.plantId}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: plantColorMap[w.plantId] || "#74c69d",
                        opacity: w.completed ? 0.4 : 1,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
            {allCompleted && <Text style={styles.checkMark}>✓</Text>}
          </Pressable>,
        );
      }
    }
    rows.push(
      <View key={`row-${row}`} style={styles.weekRow}>
        {cells}
      </View>,
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`wd-${i}`} style={styles.weekdayText}>{d}</Text>
        ))}
      </View>
      {rows}
    </View>
  );
}

export function assignPlantColors(plants: { id: string }[]): Record<string, string> {
  const map: Record<string, string> = {};
  plants.forEach((p, i) => {
    map[p.id] = PLANT_COLORS[i % PLANT_COLORS.length];
  });
  return map;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#40916c",
    textTransform: "uppercase",
  },
  weekRow: {
    flexDirection: "row",
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginVertical: 2,
    position: "relative",
  },
  todayCell: {
    backgroundColor: "#d8f3dc",
  },
  dayText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1b4332",
  },
  todayText: {
    fontWeight: "800",
    color: "#2d6a4f",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  checkMark: {
    position: "absolute",
    bottom: 2,
    right: 4,
    fontSize: 10,
    color: "#2d6a4f",
    fontWeight: "800",
  },
});
