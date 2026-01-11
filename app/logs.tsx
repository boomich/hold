import { useEffect, useState } from 'react';
import { FlatList, Platform, View } from 'react-native';
import { Screen } from '../src/components/Screen';
import { AppText } from '../src/components/AppText';
import { Button } from '../src/components/Button';
import { getRecentLogs, LogEntry } from '../src/features/logs/logService';
import { format } from 'date-fns';
import { colors } from '../src/design/tokens';

// Conditionally import native-only modules
let FileSystem: typeof import('expo-file-system') | null = null;
let Sharing: typeof import('expo-sharing') | null = null;

if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
  Sharing = require('expo-sharing');
}

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

    if (Platform.OS === 'web') {
      // Web: download as file
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hold-logs-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    if (FileSystem && Sharing) {
      const uri = `${FileSystem.cacheDirectory}hold-logs-${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(uri, text);
      await Sharing.shareAsync(uri, { mimeType: 'text/plain' });
    }
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
