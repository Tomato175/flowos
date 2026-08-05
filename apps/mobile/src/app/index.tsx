import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, fontSize } from '@flow/design-system';
import { Button } from '@flow/ui';

export default function HomeScreen() {
  const modules = [
    { emoji: '🎯', label: '专注', color: colors.module.focus },
    { emoji: '✅', label: '任务', color: colors.module.tasks },
    { emoji: '📅', label: '日历', color: colors.module.calendar },
    { emoji: '🔥', label: '习惯', color: colors.module.habits },
    { emoji: '🎯', label: '目标', color: colors.module.goals },
    { emoji: '📝', label: '笔记', color: colors.module.notes },
    { emoji: '😊', label: '心情', color: colors.module.mood },
    { emoji: '🎵', label: '音乐', color: colors.module.music },
    { emoji: '📷', label: '照片', color: colors.module.photos },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.logo}>🌀</Text>
      <Text style={styles.title}>心流OS</Text>
      <Text style={styles.subtitle}>开源个人生活中枢 — 让每一天都沉浸在专注中</Text>

      <View style={styles.modules}>
        {modules.map((m) => (
          <View key={m.label} style={[styles.moduleBadge, { backgroundColor: m.color }]}>
            <Text style={styles.moduleText}>
              {m.emoji} {m.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button variant="primary" size="lg" fullWidth>
          开始使用
        </Button>
        <View style={{ height: spacing[2] }} />
        <Button variant="secondary" size="lg" fullWidth>
          查看文档 →
        </Button>
      </View>

      <View style={styles.status}>
        <Text style={styles.statusText}>🚧 Phase 0 — Monorepo + 基础设施搭建中</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[12],
    minHeight: '100%',
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing[2],
  },
  title: {
    fontSize: Number.parseFloat(fontSize['3xl']),
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: Number.parseFloat(fontSize.base),
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[8],
  },
  modules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[8],
  },
  moduleBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 999,
  },
  moduleText: {
    color: '#FFFFFF',
    fontSize: Number.parseFloat(fontSize.sm),
    fontWeight: '500',
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    marginBottom: spacing[8],
  },
  status: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  statusText: {
    fontSize: Number.parseFloat(fontSize.sm),
    color: colors.neutral[400],
  },
});
