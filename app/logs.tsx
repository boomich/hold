import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Screen } from '../src/components/Screen';
import { AppText } from '../src/components/AppText';
import { Button } from '../src/components/Button';
import { getRecentLogs, LogEntry } from '../src/features/logs/logService';
import { format } from 'date-fns';
import { colors } from '../src/design/tokens';

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    getRecentLogs().then(setLogs);
  }, []);

  const handleExport = async () => {
    const text = logs
      .slice()
      .reverse()
      .map((log) => `[${log.level.toUpperCase()}] ${log.createdAt} - ${log.message}`)
      .join('\n');
    const uri = `${FileSystem.cacheDirectory}hold-logs-${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(uri, text);
    await Sharing.shareAsync(uri, { mimeType: 'text/plain' });
  };

  return (
    <Screen>
      <View className="flex-1 pb-6">
        <View className="mt-6">
          <AppText variant="title">Logs</AppText>
          <AppText variant="muted" className="mt-1">
            Last 200 entries.
          </AppText>
        </View>

        <View className="mt-4">
          <Button label="Export logs" onPress={handleExport} />
        </View>

        <FlatList
          data={logs}
          keyExtractor={(item) => `${item.id}`}
          contentContainerStyle={{ paddingVertical: 16 }}
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl bg-surface px-4 py-3">
              <AppText variant="caption" className="text-inkMuted">
                {format(new Date(item.createdAt), 'MMM d, HH:mm')} · {item.level.toUpperCase()}
              </AppText>
              <AppText className="mt-1" style={{ color: item.level === 'error' ? colors.rose : colors.ink }}>
                {item.message}
              </AppText>
            </View>
          )}
        />
      </View>
    </Screen>
  );
}
