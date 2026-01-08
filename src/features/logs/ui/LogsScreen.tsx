import { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { cacheDirectory, documentDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Card } from '@/shared/ui/Card';
import { Screen } from '@/shared/ui/Screen';
import { Text } from '@/shared/ui/Text';
import { Button } from '@/shared/ui/Button';
import { fetchLogs } from '@/features/logs/domain/logService';
import { LogEntry } from '@/features/logs/storage/logRepository';

export const LogsScreen = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchLogs();
      setLogs(data);
    };
    load();
  }, []);

  const exportLogs = async () => {
    const content = logs
      .map((entry) => `${entry.createdAt} [${entry.level.toUpperCase()}] ${entry.message}`)
      .join('\n');
    const baseDir = cacheDirectory ?? documentDirectory;
    if (!baseDir) {
      throw new Error('No writable directory available');
    }
    const fileUri = `${baseDir}hold-logs.txt`;
    await writeAsStringAsync(fileUri, content);
    await Sharing.shareAsync(fileUri, { mimeType: 'text/plain', dialogTitle: 'Export Hold logs' });
  };

  return (
    <Screen>
      <View className="gap-4 pt-6">
        <Text variant="title">Logs</Text>
        <Card className="gap-2">
          <Text variant="small">Last {logs.length} entries</Text>
          <Button label="Export logs" variant="secondary" onPress={exportLogs} />
        </Card>
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          contentContainerClassName="gap-3 pb-10"
          renderItem={({ item }) => (
            <Card className="gap-1">
              <Text variant="small">{item.createdAt}</Text>
              <Text variant="body">[{item.level.toUpperCase()}] {item.message}</Text>
            </Card>
          )}
        />
      </View>
    </Screen>
  );
};
